// app.js – InstantQuote (original v0.4 look) + regional refinement + feedback logging
const { useState, useEffect, useRef } = React;

function App() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Address + geo
  const [address, setAddress] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  // Lead fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [budgetResponse, setBudgetResponse] = useState("");
  const [timeline, setTimeline] = useState("");

  // Estimate
  const [estimate, setEstimate] = useState(null);

  // Google Places
  const addressInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [autocompleteReady, setAutocompleteReady] = useState(false);

  // Regional refinement
  const [showRefine, setShowRefine] = useState(false);
  const [refineSize, setRefineSize] = useState(""); // small | medium | large
  const [refineComplexity, setRefineComplexity] = useState(""); // low | medium | high
  const [regionalRanges, setRegionalRanges] = useState(null);

  // Pricing config (keep your v0.4 feel, still supports complexity)
  const [pricingConfig] = useState({
    tolerancePercent: 8,        // ±5% band
    simpleLowPerSq: 550,        // low end
    complexHighPerSq: 1012,     // high end (your original was higher)
    wastePercent: 8,            // size padding
    solarAdjustmentPercent: 8   // apply only to solar sourced area
  });

  /* -------------------- GOOGLE PLACES WIRING -------------------- */
  useEffect(() => {
    window.__INSTAQUOTE_ON_GOOGLE_READY = function () {
      try {
        if (!window.google || !window.google.maps || !window.google.maps.places) {
          console.warn("Autocomplete: Google Maps Places not available yet");
          return;
        }
        if (!addressInputRef.current) {
          console.warn("Autocomplete: input element not ready");
          return;
        }

        if (!autocompleteRef.current) {
          autocompleteRef.current = new window.google.maps.places.Autocomplete(
            addressInputRef.current,
            {
              types: ["address"],
              componentRestrictions: { country: "ca" }
            }
          );

          if (autocompleteRef.current.setFields) {
            autocompleteRef.current.setFields(["formatted_address", "geometry", "place_id"]);
          }

          autocompleteRef.current.addListener("place_changed", () => {
            const place = autocompleteRef.current.getPlace();
            if (!place || !place.formatted_address) return;

            setAddress(place.formatted_address);
            setPlaceId(place.place_id || "");

            const g = place.geometry && place.geometry.location;
            if (g && typeof g.lat === "function" && typeof g.lng === "function") {
              setLat(g.lat());
              setLng(g.lng());
            } else {
              setLat(null);
              setLng(null);
            }
          });
        }

        setAutocompleteReady(true);
      } catch (err) {
        console.error("Error initializing autocomplete:", err);
      }
    };

    if (window.__INSTAQUOTE_GOOGLE_READY_PENDING) {
      window.__INSTAQUOTE_ON_GOOGLE_READY();
      window.__INSTAQUOTE_GOOGLE_READY_PENDING = false;
    }

    if (window.google && window.google.maps && window.google.maps.places) {
      window.__INSTAQUOTE_ON_GOOGLE_READY();
    }
  }, []);

  /* ---------------------- IMAGE HELPERS ------------------------- */
  const sizeImageSrc = (sizeKey) => {
    // filenames you confirmed exist
    if (sizeKey === "small") return "assets/small-simple.png";
    if (sizeKey === "medium") return "assets/medium_size-complex.png";
    if (sizeKey === "large") return "assets/large-complex.png";
    return "assets/medium_size-complex.png";
  };

  const complexityImageSrc = (band) => {
    if (band === "low") return "assets/small-simple.png";
    if (band === "medium") return "assets/medium_size-complex.png";
    if (band === "high") return "assets/large-complex.png";
    return "assets/medium_size-complex.png";
  };

  const getAreaSourceChip = (areaSource) => {
    if (areaSource === "solar") return "Using aerial roof data";
    if (areaSource === "regional") return "Estimated size for your region";
    return "Estimate based on internal models";
  };

  const getComplexityLabel = (band) => {
    if (band === "low") return "Simple roof";
    if (band === "medium") return "Moderate complexity";
    if (band === "high") return "Higher complexity";
    return "Typical roof";
  };

  const getComplexityDescription = (band) => {
    if (band === "low") return "Straightforward roof lines, fewer valleys and transitions.";
    if (band === "medium") return "Some hips, valleys, or extra sections, typical of many homes.";
    if (band === "high") return "Multiple roof lines, more valleys, transitions, and detail work.";
    return "We will confirm complexity and any extra details during your detailed quote.";
  };

  /* ---------------------- PRICING CORE -------------------------- */
  const pitchDegreesToPitchOver12 = (pitchDegrees) => {
    let displayPitch = 6;
    if (pitchDegrees < 22) displayPitch = 4;
    else if (pitchDegrees < 30) displayPitch = 6;
    else if (pitchDegrees < 38) displayPitch = 8;
    else displayPitch = 10;
    return displayPitch;
  };

  const computeRange = ({ roofAreaSqft, pitchOver12, complexityBand, areaSource }) => {
    const squares = roofAreaSqft / 100;

    const {
      tolerancePercent,
      simpleLowPerSq,
      complexHighPerSq,
      wastePercent,
      solarAdjustmentPercent
    } = pricingConfig;

    const wasteFactor = (wastePercent ?? 0) / 100;
    const solarFactor = (solarAdjustmentPercent ?? 0) / 100;

    const drift = areaSource === "solar" ? (1 + solarFactor) : 1;
    const adjustedSquares = squares * (1 + wasteFactor) * drift;

    // Complexity drives where we land in the band, pitch still matters
    let centerPerSq;
    if (pitchOver12 <= 2) {
      centerPerSq = (simpleLowPerSq + complexHighPerSq) / 2;
    } else {
      if (complexityBand === "high") centerPerSq = complexHighPerSq;
      else if (complexityBand === "medium") centerPerSq = (simpleLowPerSq + complexHighPerSq) / 2;
      else centerPerSq = simpleLowPerSq; // low or unknown
    }

    const centerPrice = adjustedSquares * centerPerSq;
    const tol = (tolerancePercent ?? 0) / 100;

    let low = centerPrice * (1 - tol);
    let high = centerPrice * (1 + tol);

    low = Math.round(low / 50) * 50;
    high = Math.round(high / 50) * 50;

    return { low, high };
  };

  /* ---------------------- FEEDBACK LOG -------------------------- */
  const logRegionalFeedback = async ({ reason, sizeChoice, complexityChoice, finalSqft }) => {
    try {
      if (!estimate || estimate.areaSource !== "regional") return;

      await fetch("mega-regional-feedback.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          placeId,
          lat,
          lng,
          baseSqft: estimate.baseRoofArea || estimate.roofArea,
          shownSqft: estimate.roofArea,
          finalSqft: finalSqft || estimate.roofArea,
          sizeChoice: sizeChoice || "",
          complexityChoice: complexityChoice || "",
          reason: reason || "regional_mismatch"
        })
      });
    } catch (e) {
      console.warn("regional feedback log failed", e);
    }
  };

  /* ---------------------- ESTIMATE HANDLER ---------------------- */
  const handleGetEstimate = async () => {
    if (!address.trim()) {
      alert("Please enter a property address");
      return;
    }

    // Encourage full address for better results
    if (!/calgary/i.test(address) && !/ab/i.test(address) && !/alberta/i.test(address)) {
      const ok = window.confirm(
        "We recommend entering the full address including city and province for best accuracy. Continue anyway?"
      );
      if (!ok) return;
    }

    setLoading(true);

    try {
      const res = await fetch("mega-estimate.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          placeId: placeId || "",
          lat: typeof lat === "number" ? lat : null,
          lng: typeof lng === "number" ? lng : null
        })
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error("Server returned an invalid response.");
      }

      if (!res.ok || !data || data.ok === false) {
        throw new Error((data && data.error) || "Failed to get estimate from server.");
      }

      const roofArea = Math.round(data.roofAreaSqft);
      const pitchDegrees = data.pitchDegrees ?? 25;
      const pitchOver12 = pitchDegreesToPitchOver12(pitchDegrees);

      const areaSource = data.areaSource || null;
      const complexityBand = data.complexityBand || "unknown";

      const pr = computeRange({
        roofAreaSqft: roofArea,
        pitchOver12,
        complexityBand,
        areaSource
      });

      setRegionalRanges(data.regionalRanges || null);

      setEstimate({
        roofArea,
        baseRoofArea: roofArea,
        pitch: pitchOver12,
        low: pr.low,
        high: pr.high,
        dataSource: data.dataSource || "Google Solar API",
        areaSource,
        complexityBand
      });

      setShowRefine(false);
      setRefineSize("");
      setRefineComplexity("");

      setStep(2);
    } catch (err) {
      console.error(err);
      alert(err && err.message ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- REGIONAL REFINEMENT FLOW -------------------- */
  const openRefine = () => {
    setRefineSize("");
    setRefineComplexity("");
    setShowRefine(true);
  };

  const applyRefinement = async () => {
    if (!estimate || estimate.areaSource !== "regional") return;

    if (!refineSize || !refineComplexity) {
      alert("Please select a size and complexity.");
      return;
    }

    const rr = regionalRanges || { min_sqft: 1200, max_sqft: 2600, center: 1900 };

    const sizeSqftMap = {
      small: Math.round(rr.min_sqft),
      medium: Math.round(rr.center),
      large: Math.round(rr.max_sqft)
    };

    const newSqft = sizeSqftMap[refineSize] || Math.round(rr.center);

    const pr = computeRange({
      roofAreaSqft: newSqft,
      pitchOver12: estimate.pitch || 6,
      complexityBand: refineComplexity,
      areaSource: "regional"
    });

    setEstimate({
      ...estimate,
      roofArea: newSqft,
      low: pr.low,
      high: pr.high,
      complexityBand: refineComplexity,
      dataSource: "Refined regional estimate",
      areaSource: "regional"
    });

    await logRegionalFeedback({
      reason: "user_refined_regional_estimate",
      sizeChoice: refineSize,
      complexityChoice: refineComplexity,
      finalSqft: newSqft
    });

    setShowRefine(false);
  };

  /* ------------------------ LEAD SUBMIT ------------------------- */
  const handleSubmitLead = async () => {
    if (!name || !email || !phone || !budgetResponse) {
      alert("Please fill out all required fields.");
      return;
    }

    setLoading(true);

    try {
      const roofAreaSqft = estimate ? estimate.roofArea : null;
      const roofSquares = estimate && estimate.roofArea ? estimate.roofArea / 100 : null;

      const payload = {
        address,
        placeId,
        lat,
        lng,
        name,
        email,
        phone,
        budgetResponse,
        timeline,
        roofAreaSqft,
        roofSquares,
        pitch: estimate ? estimate.pitch : null,
        goodLow: estimate ? estimate.low : null,
        goodHigh: estimate ? estimate.high : null,
        dataSource: estimate ? estimate.dataSource : null,
        areaSource: estimate ? estimate.areaSource : null,
        complexityBand: estimate ? estimate.complexityBand : null,
        source: "instantquote"
      };

      const res = await fetch("save-lead.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error("Server returned an invalid response.");
      }

      if (!res.ok || !data || data.ok === false) {
        throw new Error((data && data.error) || "Failed to save your request. Please try again.");
      }

      setStep(3);
    } catch (err) {
      console.error(err);
      alert(err && err.message ? err.message : "Could not submit your request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------ RESET FORM -------------------------- */
  const resetForm = () => {
    setStep(1);
    setLoading(false);

    setAddress("");
    setPlaceId("");
    setLat(null);
    setLng(null);

    setName("");
    setEmail("");
    setPhone("");
    setBudgetResponse("");
    setTimeline("");

    setEstimate(null);

    setRegionalRanges(null);
    setShowRefine(false);
    setRefineSize("");
    setRefineComplexity("");
  };

  /* ---------------------------- UI ------------------------------ */

  // STEP 1 – original nice look
  if (step === 1) {
    return React.createElement(
      "div",
      { className: "w-full" },
      React.createElement(
        "div",
        {
          className:
            "bg-white rounded-2xl shadow-xl p-8 border-t-4 border-[#C9362E]"
        },
        React.createElement(
          "div",
          { className: "mb-6" },
          React.createElement(
            "h1",
            { className: "text-3xl md:text-4xl font-bold text-gray-900 mb-2" },
            "Instant Roof Quote"
          ),
          React.createElement(
            "p",
            { className: "text-gray-600" },
            "Get a ballpark price in under 60 seconds. No sales pressure, no obligation."
          )
        ),
        React.createElement(
          "label",
          { className: "block text-sm font-medium text-gray-700 mb-2" },
          "Property Address"
        ),
        React.createElement(
          "div",
          { className: "flex flex-col md:flex-row gap-3" },
          React.createElement("input", {
            type: "text",
            ref: addressInputRef,
            value: address,
            onChange: (e) => setAddress(e.target.value),
            placeholder: "123 Main St SW, Calgary, AB",
            className:
              "flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9362E] focus:border-transparent",
            onKeyDown: (e) => e.key === "Enter" && handleGetEstimate()
          }),
          React.createElement(
            "button",
            {
              onClick: handleGetEstimate,
              disabled: loading || !address.trim(),
              className:
                "px-6 py-3 bg-[#C9362E] text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            },
            loading
              ? React.createElement(
                  React.Fragment,
                  null,
                  React.createElement("div", {
                    className:
                      "w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                  }),
                  " Processing..."
                )
              : "Get My Instant Estimate"
          )
        ),
        React.createElement(
          "p",
          { className: "mt-2 text-xs text-gray-500" },
          autocompleteReady
            ? "Start typing and select your address from the suggestions."
            : "Loading address suggestions..."
        ),
        React.createElement(
          "div",
          { className: "mt-6 grid grid-cols-3 gap-4 text-center text-xs" },
          React.createElement(
            "div",
            { className: "p-3 bg-slate-50 rounded-lg" },
            React.createElement(
              "div",
              { className: "text-lg font-bold text-gray-900" },
              "≈ 60s"
            ),
            React.createElement("div", { className: "text-gray-600" }, "Instant ballpark price")
          ),
          React.createElement(
            "div",
            { className: "p-3 bg-slate-50 rounded-lg" },
            React.createElement(
              "div",
              { className: "text-lg font-bold text-gray-900" },
              "No cost"
            ),
            React.createElement("div", { className: "text-gray-600" }, "Free, no obligation")
          ),
          React.createElement(
            "div",
            { className: "p-3 bg-slate-50 rounded-lg" },
            React.createElement(
              "div",
              { className: "text-lg font-bold text-gray-900" },
              "±5%"
            ),
            React.createElement(
              "div",
              { className: "text-gray-600" },
              "Typical accuracy range on roof size"
            )
          )
        ),
        React.createElement(
          "p",
          { className: "mt-4 text-[11px] text-gray-500" },
          "Note: This tool estimates the main building roof only. Detached garages, sheds, and additions may not be fully captured and will be confirmed during your detailed quote."
        ),
        React.createElement(
          "p",
          { className: "mt-2 text-xs text-gray-500 text-center" },
          "🔒 Your information is secure and will never be shared or sold."
        )
      )
    );
  }

  // STEP 2 – estimate
  if (step === 2 && estimate) {
    const isRegional = estimate.areaSource === "regional";

    const complexityLabel = getComplexityLabel(estimate.complexityBand);
    const complexityDescription = getComplexityDescription(estimate.complexityBand);
    const complexityImg = complexityImageSrc(estimate.complexityBand);
    const areaSourceChip = getAreaSourceChip(estimate.areaSource);

    return React.createElement(
      "div",
      { className: "w-full" },
      React.createElement(
        "div",
        {
          className:
            "bg-white rounded-2xl shadow-xl p-8 border-t-4 border-[#C9362E] space-y-6"
        },

        React.createElement(
          "div",
          { className: "text-center" },
          React.createElement(
            "h2",
            { className: "text-2xl font-bold text-gray-900 mb-1" },
            "Your Instant Roof Estimate"
          ),
          React.createElement("p", { className: "text-sm text-gray-600" }, address)
        ),

        React.createElement(
          "div",
          { className: "bg-[#C9362E] rounded-xl p-6 text-white text-center space-y-2" },
          React.createElement(
            "div",
            { className: "text-xs uppercase tracking-wide opacity-80" },
            "Estimated range"
          ),
          React.createElement(
            "div",
            { className: "text-3xl md:text-4xl font-extrabold" },
            "$",
            estimate.low.toLocaleString(),
            " – $",
            estimate.high.toLocaleString()
          ),
          React.createElement(
            "p",
            { className: "text-xs md:text-sm opacity-90" },
            "Final price depends on roof condition, access, materials, and any extras you choose."
          ),
          React.createElement(
            "div",
            { className: "mt-4 grid grid-cols-3 gap-3 text-xs md:text-sm text-left" },
            React.createElement(
              "div",
              null,
              React.createElement("div", { className: "opacity-75" }, "Size"),
              React.createElement("div", { className: "font-semibold" }, estimate.roofArea, " sqft")
            ),
            React.createElement(
              "div",
              null,
              React.createElement("div", { className: "opacity-75" }, "Pitch"),
              React.createElement("div", { className: "font-semibold" }, estimate.pitch, "/12")
            ),
            React.createElement(
              "div",
              null,
              React.createElement("div", { className: "opacity-75" }, "Data source"),
              React.createElement("div", { className: "font-semibold text-xs" }, estimate.dataSource)
            )
          )
        ),

        // Complexity section (same nice style, now with your 3 images)
        React.createElement(
          "div",
          { className: "bg-slate-50 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center" },
          React.createElement("img", {
            src: complexityImg,
            alt: complexityLabel,
            className: "w-28 h-20 object-cover rounded-lg border border-gray-200"
          }),
          React.createElement(
            "div",
            { className: "flex-1" },
            React.createElement(
              "div",
              { className: "flex flex-wrap items-center gap-2 mb-2" },
              React.createElement(
                "span",
                { className: "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-gray-200 text-gray-800" },
                complexityLabel
              ),
              React.createElement(
                "span",
                { className: "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-green-100 text-green-700" },
                areaSourceChip
              )
            ),
            React.createElement("p", { className: "text-xs text-gray-700" }, complexityDescription)
          )
        ),

        // Regional fallback notice + refinement CTA
        isRegional &&
          React.createElement(
            "div",
            { className: "rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900" },
            React.createElement("p", { className: "font-semibold mb-1" }, "We were unable to get rooftop satellite data for this address."),
            React.createElement(
              "p",
              { className: "mb-3" },
              "This estimate is a best guess based on typical home sizes in your area. If you want a closer representation, you can refine it below."
            ),
            React.createElement(
              "div",
              { className: "flex flex-col sm:flex-row gap-2" },
              React.createElement(
                "button",
                {
                  onClick: openRefine,
                  className: "inline-flex items-center justify-center px-3 py-2 rounded-lg bg-white border border-amber-300 text-amber-900 font-semibold hover:bg-amber-100"
                },
                "Refine estimate"
              ),
              React.createElement(
                "button",
                {
                  onClick: async () => {
                    await logRegionalFeedback({
                      reason: "user_clicked_regional_not_accurate",
                      sizeChoice: "",
                      complexityChoice: "",
                      finalSqft: estimate.roofArea
                    });
                    alert("Thanks, we will use this to improve our regional sizing model.");
                  },
                  className: "inline-flex items-center justify-center px-3 py-2 rounded-lg bg-transparent border border-amber-300 text-amber-900 font-semibold hover:bg-amber-100"
                },
                "This does not match my home"
              )
            )
          ),

        // Refinement panel
        showRefine &&
          React.createElement(
            "div",
            { className: "rounded-2xl border border-gray-200 bg-white p-4 shadow-sm" },
            React.createElement(
              "div",
              { className: "flex items-center justify-between mb-3" },
              React.createElement("div", { className: "font-bold text-sm text-gray-900" }, "Refine your estimate"),
              React.createElement(
                "button",
                { onClick: () => setShowRefine(false), className: "text-xs text-gray-500 hover:text-gray-700 underline" },
                "Close"
              )
            ),
            React.createElement(
              "div",
              { className: "text-xs text-gray-600 mb-3" },
              "Pick the closest house size, then choose roof complexity. We will update the estimate immediately."
            ),

            // Size picker
            React.createElement(
              "div",
              { className: "mb-4" },
              React.createElement("div", { className: "text-xs font-semibold text-gray-800 mb-2" }, "1) House size"),
              React.createElement(
                "div",
                { className: "grid grid-cols-1 sm:grid-cols-3 gap-3" },
                ["small", "medium", "large"].map((k) =>
                  React.createElement(
                    "button",
                    {
                      key: k,
                      type: "button",
                      onClick: () => setRefineSize(k),
                      className:
                        "text-left rounded-xl border " +
                        (refineSize === k ? "border-[#C9362E] ring-2 ring-[#C9362E]/30" : "border-gray-200") +
                        " bg-white hover:bg-gray-50 p-2"
                    },
                    React.createElement("img", {
                      src: sizeImageSrc(k),
                      className: "w-full h-24 object-cover rounded-lg border border-gray-200",
                      alt: k + " house"
                    }),
                    React.createElement(
                      "div",
                      { className: "mt-2 text-xs font-semibold text-gray-900" },
                      k === "small" ? "Small" : k === "medium" ? "Medium" : "Large"
                    ),
                    React.createElement(
                      "div",
                      { className: "text-[11px] text-gray-600" },
                      regionalRanges
                        ? (k === "small"
                            ? `${Math.round(regionalRanges.min_sqft)} sqft`
                            : k === "medium"
                            ? `${Math.round(regionalRanges.center)} sqft`
                            : `${Math.round(regionalRanges.max_sqft)} sqft`)
                        : (k === "small" ? "Small range" : k === "medium" ? "Medium range" : "Large range")
                    )
                  )
                )
              )
            ),

            // Complexity picker
            React.createElement(
              "div",
              { className: "mb-4" },
              React.createElement("div", { className: "text-xs font-semibold text-gray-800 mb-2" }, "2) Roof complexity"),
              React.createElement(
                "div",
                { className: "grid grid-cols-1 sm:grid-cols-3 gap-3" },
                [
                  { key: "low", label: "Simple", img: "assets/small-simple.png" },
                  { key: "medium", label: "Medium", img: "assets/medium_size-complex.png" },
                  { key: "high", label: "Complex", img: "assets/large-complex.png" }
                ].map((c) =>
                  React.createElement(
                    "button",
                    {
                      key: c.key,
                      type: "button",
                      onClick: () => setRefineComplexity(c.key),
                      className:
                        "text-left rounded-xl border " +
                        (refineComplexity === c.key ? "border-[#C9362E] ring-2 ring-[#C9362E]/30" : "border-gray-200") +
                        " bg-white hover:bg-gray-50 p-2"
                    },
                    React.createElement("img", {
                      src: c.img,
                      className: "w-full h-24 object-cover rounded-lg border border-gray-200",
                      alt: c.label
                    }),
                    React.createElement("div", { className: "mt-2 text-xs font-semibold text-gray-900" }, c.label)
                  )
                )
              )
            ),

            React.createElement(
              "div",
              { className: "flex flex-col sm:flex-row gap-3" },
              React.createElement(
                "button",
                {
                  onClick: applyRefinement,
                  className:
                    "flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl bg-[#C9362E] text-white font-semibold hover:bg-[#b02f27]"
                },
                "Apply refinement"
              ),
              React.createElement(
                "button",
                {
                  onClick: async () => {
                    await logRegionalFeedback({
                      reason: "user_skipped_refine",
                      sizeChoice: "",
                      complexityChoice: "",
                      finalSqft: estimate.roofArea
                    });
                    setShowRefine(false);
                  },
                  className:
                    "px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
                },
                "Skip"
              )
            )
          ),

        React.createElement(
          "p",
          { className: "text-[11px] text-gray-500" },
          "Note: This estimate is based on your main roof structure. Detached garages or accessory buildings are not reflected and will be confirmed during your detailed quote."
        ),

        // Lead form (original nice v0.4 look)
        React.createElement(
          "div",
          { className: "space-y-4" },
          React.createElement(
            "h3",
            { className: "font-semibold text-lg" },
            "Want a precise quote and options (good / better / best)?"
          ),
          React.createElement(
            "div",
            { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
            React.createElement(
              "div",
              null,
              React.createElement(
                "label",
                { className: "block text-sm font-medium text-gray-700 mb-1" },
                "Full Name *"
              ),
              React.createElement("input", {
                type: "text",
                value: name,
                onChange: (e) => setName(e.target.value),
                className:
                  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9362E]",
                placeholder: "John Smith"
              })
            ),
            React.createElement(
              "div",
              null,
              React.createElement(
                "label",
                { className: "block text-sm font-medium text-gray-700 mb-1" },
                "Phone *"
              ),
              React.createElement("input", {
                type: "tel",
                value: phone,
                onChange: (e) => setPhone(e.target.value),
                className:
                  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9362E]",
                placeholder: "(403) 555-1234"
              })
            )
          ),
          React.createElement(
            "div",
            null,
            React.createElement(
              "label",
              { className: "block text-sm font-medium text-gray-700 mb-1" },
              "Email *"
            ),
            React.createElement("input", {
              type: "email",
              value: email,
              onChange: (e) => setEmail(e.target.value),
              className:
                "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9362E]",
              placeholder: "you@example.com"
            })
          ),
          React.createElement(
            "div",
            null,
            React.createElement(
              "label",
              { className: "block text-sm font-medium text-gray-700 mb-2" },
              "Is this in your budget? *"
            ),
            React.createElement(
              "div",
              { className: "space-y-2" },
              [
                { value: "yes", label: "✅ Yes, I'm ready to move forward", color: "#16a34a" },
                { value: "financing", label: "💳 I need to see monthly payment options", color: "#ea580c" },
                { value: "too_expensive", label: "❌ Too high, I’m just price checking", color: "#dc2626" }
              ].map((option) =>
                React.createElement(
                  "button",
                  {
                    key: option.value,
                    type: "button",
                    onClick: () => setBudgetResponse(option.value),
                    className: "w-full p-3 border-2 rounded-lg text-left transition-all",
                    style:
                      budgetResponse === option.value
                        ? { borderColor: option.color, backgroundColor: "#fef2f2" }
                        : {}
                  },
                  option.label
                )
              )
            )
          ),
          React.createElement(
            "div",
            null,
            React.createElement(
              "label",
              { className: "block text-sm font-medium text-gray-700 mb-1" },
              "How soon are you looking to do this?"
            ),
            React.createElement(
              "select",
              {
                value: timeline,
                onChange: (e) => setTimeline(e.target.value),
                className:
                  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9362E]"
              },
              [
                { value: "", label: "Select an option..." },
                { value: "asap", label: "ASAP (within 2 weeks)" },
                { value: "1_month", label: "Within 1 month" },
                { value: "3_months", label: "Within 3 months" },
                { value: "planning", label: "Just planning / comparing" }
              ].map((opt) =>
                React.createElement("option", { key: opt.value, value: opt.value }, opt.label)
              )
            )
          ),
          React.createElement(
            "button",
            {
              onClick: handleSubmitLead,
              disabled: loading || !name || !email || !phone || !budgetResponse,
              className:
                "w-full py-3 bg-[#C9362E] text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-medium text-lg"
            },
            loading ? "Submitting..." : "Request My Detailed Quote →"
          ),
          React.createElement(
            "p",
            { className: "text-[10px] text-gray-500 text-center leading-snug" },
            "By submitting, you agree we may contact you about this project. No spam. No pressure."
          ),
          React.createElement(
            "button",
            { type: "button", onClick: resetForm, className: "text-xs text-gray-400 hover:text-gray-600 underline" },
            "Start over"
          )
        )
      )
    );
  }

  // STEP 3 – thank you (same as original)
  if (step === 3) {
    return React.createElement(
      "div",
      { className: "w-full" },
      React.createElement(
        "div",
        {
          className:
            "bg-white rounded-2xl shadow-xl p-8 border-t-4 border-[#16a34a] text-center space-y-4"
        },
        React.createElement(
          "div",
          {
            className:
              "inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-2"
          },
          React.createElement("span", { className: "text-3xl" }, "✅")
        ),
        React.createElement(
          "h2",
          { className: "text-2xl font-bold text-gray-900" },
          "We’ve got your request!"
        ),
        React.createElement(
          "p",
          { className: "text-gray-600" },
          "Thanks, ",
          name || "there",
          ". A Mega Roofing estimator will review your roof details and contact you within 24 hours at ",
          phone || "your phone",
          "."
        ),
        React.createElement(
          "div",
          { className: "bg-slate-50 rounded-lg p-4 text-left text-sm" },
          React.createElement("p", { className: "font-semibold mb-2" }, "What happens next:"),
          React.createElement(
            "ol",
            { className: "list-decimal ml-5 space-y-1 text-gray-700" },
            React.createElement("li", null, "We confirm your address and roof type."),
            React.createElement("li", null, "We build a precise quote with good / better / best options."),
            React.createElement("li", null, "You review everything by email or phone, zero pressure.")
          )
        ),
        React.createElement(
          "button",
          {
            onClick: resetForm,
            className:
              "mt-4 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
          },
          "Price another property"
        )
      )
    );
  }

  return null;
}

/* -------------------------- MOUNT APP --------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  const rootEl = document.getElementById("instaquote-root");
  if (!rootEl) {
    console.error("Missing #instaquote-root");
    return;
  }
  const root = ReactDOM.createRoot(rootEl);
  root.render(React.createElement(App));
});
