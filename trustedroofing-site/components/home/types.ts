export type HomeMetric = {
  id: string;
  key_name: string;
  label: string;
  value_text: string;
  sort_order: number;
  is_active: boolean;
};

export type HomeActivity = {
  id: string;
  type: "quote" | "project" | "geo_post";
  service: string;
  location: string;
  message: string;
  occurredAt: string;
  href: string;
};

export type HomeProject = {
  id: string;
  slug: string;
  title: string;
  service: string;
  neighborhood: string;
  summary: string;
  image: string;
};

export type HomeService = {
  slug: string;
  title: string;
  copy: string;
};

export type HomeArea = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
};
