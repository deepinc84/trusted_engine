export type BusinessProfileStatus = "verified" | "unverified" | "pending";
export type SubmissionStatus = "not-submitted" | "submitted" | "live";
export type LinkFollowStatus = "follow" | "nofollow" | "unknown";

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
  /** Optional operational fields reserved for future citation management. */
  submissionStatus?: SubmissionStatus;
  googleDiscovered?: boolean | null;
  linkFollowStatus?: LinkFollowStatus;
  lastChecked?: string | null;
};

type PublicProfileInput = Pick<BusinessProfile, "id" | "name" | "url" | "type" | "description"> &
  Partial<Pick<BusinessProfile, "featured" | "notes">>;

function publicProfile(profile: PublicProfileInput): BusinessProfile {
  return {
    ...profile,
    active: true,
    dateAdded: null,
    verificationStatus: "unverified",
    googleIndexed: null,
    backlinkPresent: null,
    notes: profile.notes ?? null
  };
}

export const businessProfiles: BusinessProfile[] = [
  publicProfile({ id: "facebook", name: "Facebook", url: "https://facebook.com/TrustedRoofingCalgary", type: "Social Profile", description: "View Trusted Roofing & Exteriors on Facebook.", featured: true }),
  publicProfile({ id: "linkedin", name: "LinkedIn", url: "https://www.linkedin.com/company/trusted-roofing-exteriors/", type: "Company Profile", description: "View the Trusted Roofing & Exteriors company profile on LinkedIn.", featured: true }),
  publicProfile({ id: "trustedpros", name: "TrustedPros", url: "https://trustedpros.ca/company/trusted-roofing-and-exteriors", type: "Contractor Directory", description: "View the Trusted Roofing & Exteriors contractor profile on TrustedPros." }),
  publicProfile({ id: "yelp-canada", name: "Yelp Canada", url: "https://m.yelp.ca/biz/trusted-roofing-and-exteriors-calgary", type: "Business Directory", description: "View business information for Trusted Roofing & Exteriors on Yelp Canada.", featured: true }),
  publicProfile({ id: "city-of-calgary", name: "CityOfCalgary.com", url: "https://www.cityofcalgary.com/directory/home-services-contractors/trusted-roofing-and-exteriors/", type: "Calgary Business Directory", description: "Find Trusted Roofing & Exteriors in the CityOfCalgary.com home services directory." }),
  publicProfile({ id: "alberta-local", name: "Alberta Local", url: "https://www.alberta-local.ca/biz/55509/trusted-roofing-and-exteriors", type: "Alberta Business Directory", description: "View the Trusted Roofing & Exteriors listing on Alberta Local." }),
  publicProfile({ id: "calgary-construction-network", name: "Calgary Construction Network", url: "https://calgaryconstructionnetwork.com/directory/listing/trusted-roofing-exteriors-calgary", type: "Calgary Construction Directory", description: "Find Trusted Roofing & Exteriors in the Calgary Construction Network contractor directory." }),
  publicProfile({ id: "shop-calgary", name: "ShopCalgary.ca", url: "https://shopcalgary.ca/trustedroofingandexteriors", type: "Calgary Business Directory", description: "View the Trusted Roofing & Exteriors listing on ShopCalgary.ca." }),
  publicProfile({ id: "do-i-need-a-roofer", name: "Do I Need A Roofer?", url: "https://www.doineedaroofer.com/directory/trusted-roofing-exteriors-calgary", type: "Roofing Directory", description: "View the Trusted Roofing & Exteriors profile on Do I Need A Roofer?" }),
  publicProfile({ id: "yellow-pages", name: "YellowPages.ca", url: "https://www.yellowpages.ca/bus/Alberta/Trusted-Roofing-And-Exteriors/105293740.html", type: "Business Directory", description: "View the Trusted Roofing & Exteriors business listing on YellowPages.ca." }),
  publicProfile({ id: "inspiring-clicks", name: "InspiringClicks", url: "https://inspiringclicks.com/calgary-businesses/directory/?category=Roofing", type: "Calgary Business Directory", description: "Find Trusted Roofing & Exteriors in the InspiringClicks Calgary roofing directory.", notes: "Shared roofing category page; intentionally excluded from organization sameAs." }),
  publicProfile({ id: "alberta-directory", name: "Alberta Directory", url: "https://albertadirectory.com/business/7e4eb3a1-425f-4d74-bfca-e49e0980c471", type: "Alberta Business Directory", description: "View the Trusted Roofing & Exteriors profile on Alberta Directory." }),
  publicProfile({ id: "nextdoor", name: "Nextdoor", url: "https://ca.nextdoor.com/pages/trusted-roofing-exteriors-calgary-ab/", type: "Local Business Profile", description: "View Trusted Roofing & Exteriors on Nextdoor.", featured: true }),
  publicProfile({ id: "homestars", name: "HomeStars", url: "https://www.homestars.com/profile/trusted-roofing-and-exteriors-inc", type: "Contractor Profile", description: "View the Trusted Roofing & Exteriors contractor profile on HomeStars.", featured: true }),
  publicProfile({ id: "ringmybiz", name: "RingMyBiz", url: "https://www.ringmybiz.com/business/trusted-roofing-exteriors-5d309a3e", type: "Business Directory", description: "View the Trusted Roofing & Exteriors business profile on RingMyBiz." }),
  publicProfile({ id: "profile-canada", name: "Profile Canada", url: "https://www.profilecanada.com/companydetail.cfm?company=320359_", type: "Canadian Business Directory", description: "View the Trusted Roofing & Exteriors listing on Profile Canada." }),
  publicProfile({ id: "medium", name: "Medium", url: "https://medium.com/@info_93117/about", type: "Publisher Profile", description: "View the Trusted Roofing & Exteriors profile on Medium." })
];

export const activeBusinessProfiles = businessProfiles.filter(
  (profile): profile is BusinessProfile & { url: string } => profile.active && Boolean(profile.url)
);
