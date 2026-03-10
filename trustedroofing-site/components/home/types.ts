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
  service: string;
  location: string;
  occurredAt: string;
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
