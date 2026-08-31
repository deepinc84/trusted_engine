export type BusinessProfileStatus = "verified" | "unverified" | "pending";

export type BusinessProfile = {
  id: string;
  name: string;
  url: string | null;
  type: string;
  description: string;
  active: boolean;
  featured?: boolean;
  dateAdded: string | null;
  verificationStatus: BusinessProfileStatus;
  googleIndexed: boolean | null;
  backlinkPresent: boolean | null;
  notes: string | null;
};

export const businessProfiles: BusinessProfile[] = [
  { id: "facebook", name: "Facebook", url: "https://facebook.com/TrustedRoofingCalgary", type: "Social Profile", description: "View Trusted Roofing & Exteriors on Facebook.", active: true, featured: true, dateAdded: null, verificationStatus: "unverified", googleIndexed: null, backlinkPresent: null, notes: null },
  { id: "linkedin", name: "LinkedIn", url: "https://www.linkedin.com/company/trusted-roofing-exteriors/", type: "Company Profile", description: "View the Trusted Roofing & Exteriors company profile on LinkedIn.", active: true, featured: true, dateAdded: null, verificationStatus: "unverified", googleIndexed: null, backlinkPresent: null, notes: null },
  { id: "trustedpros", name: "TrustedPros", url: "https://trustedpros.ca/company/trusted-roofing-and-exteriors", type: "Contractor Directory", description: "View the Trusted Roofing & Exteriors contractor profile on TrustedPros.", active: true, dateAdded: null, verificationStatus: "unverified", googleIndexed: null, backlinkPresent: null, notes: null },
  { id: "yelp-canada", name: "Yelp Canada", url: "https://m.yelp.ca/biz/trusted-roofing-and-exteriors-calgary", type: "Business Directory", description: "View business information for Trusted Roofing & Exteriors on Yelp Canada.", active: true, featured: true, dateAdded: null, verificationStatus: "unverified", googleIndexed: null, backlinkPresent: null, notes: null },
  { id: "city-of-calgary", name: "CityOfCalgary.com", url: "https://cityofcalgary.com/directory/home-services-contractors/trusted-roofing-and-exteriors", type: "Calgary Business Directory", description: "Find Trusted Roofing & Exteriors in the CityOfCalgary.com home services directory.", active: true, dateAdded: null, verificationStatus: "unverified", googleIndexed: null, backlinkPresent: null, notes: null },
  { id: "alberta-local", name: "Alberta Local", url: "https://alberta-local.ca/biz/55509/trusted-roofing-and-exteriors", type: "Alberta Business Directory", description: "View the Trusted Roofing & Exteriors listing on Alberta Local.", active: true, dateAdded: null, verificationStatus: "unverified", googleIndexed: null, backlinkPresent: null, notes: null },
  { id: "calgary-construction-network", name: "Calgary Construction Network", url: "https://calgaryconstructionnetwork.com/directory/listing/trusted-roofing-exteriors-calgary", type: "Calgary Construction Directory", description: "Find Trusted Roofing & Exteriors in the Calgary Construction Network contractor directory.", active: true, dateAdded: null, verificationStatus: "unverified", googleIndexed: null, backlinkPresent: null, notes: null },
  { id: "shop-calgary", name: "ShopCalgary.ca", url: "https://shopcalgary.ca/trustedroofingandexteriors", type: "Calgary Business Directory", description: "View the Trusted Roofing & Exteriors listing on ShopCalgary.ca.", active: true, dateAdded: null, verificationStatus: "unverified", googleIndexed: null, backlinkPresent: null, notes: null },
  { id: "do-i-need-a-roofer", name: "Do I Need A Roofer?", url: null, type: "Roofing Directory", description: "View the Trusted Roofing & Exteriors profile on Do I Need A Roofer?", active: false, dateAdded: null, verificationStatus: "pending", googleIndexed: null, backlinkPresent: null, notes: "Dedicated public profile URL not confirmed in project content." },
  { id: "yellow-pages", name: "YellowPages.ca", url: "https://www.yellowpages.ca/bus/Alberta/Trusted-Roofing-And-Exteriors/105293740.html", type: "Business Directory", description: "View the Trusted Roofing & Exteriors business listing on YellowPages.ca.", active: true, dateAdded: null, verificationStatus: "unverified", googleIndexed: null, backlinkPresent: null, notes: null },
  { id: "inspiring-clicks", name: "InspiringClicks", url: null, type: "Calgary Business Directory", description: "View the Trusted Roofing & Exteriors listing on InspiringClicks.", active: false, dateAdded: null, verificationStatus: "pending", googleIndexed: null, backlinkPresent: null, notes: "Dedicated public listing URL not confirmed in project content." },
  { id: "alberta-directory", name: "Alberta Directory", url: null, type: "Alberta Business Directory", description: "View the Trusted Roofing & Exteriors listing on Alberta Directory.", active: false, dateAdded: null, verificationStatus: "pending", googleIndexed: null, backlinkPresent: null, notes: "Dedicated public listing URL not confirmed in project content." },
  { id: "homestars", name: "HomeStars", url: "https://www.homestars.com/profile/trusted-roofing-and-exteriors-inc", type: "Contractor Profile", description: "View the Trusted Roofing & Exteriors contractor profile on HomeStars.", active: true, featured: true, dateAdded: null, verificationStatus: "unverified", googleIndexed: null, backlinkPresent: null, notes: null }
];

export const activeBusinessProfiles = businessProfiles.filter(
  (profile): profile is BusinessProfile & { url: string } => profile.active && Boolean(profile.url)
);

