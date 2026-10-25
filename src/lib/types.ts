import type {
  CategorySlug,
  ExperienceLevel,
  GovernorateSlug,
  OpportunityType,
  PosterType,
  Seeking,
} from "./taxonomy";

export type ListingKind = "talent" | "family" | "opportunity";

export type Contact = {
  whatsapp?: string;
  phone?: string;
  email?: string;
  instagram?: string;
  website?: string;
};

type BaseListing = {
  id: string;
  createdAt: string;
  governorate: GovernorateSlug;
  contact: Contact;
  /** الحساب الذي نشره، ولا يظهر للزوار. الإعلانات القديمة المُدارة برابط سري بلا صاحب حتى تُربط */
  ownerId?: string;
  /** أخفاه صاحبه */
  hidden?: boolean;
  /** أخفاه فريق الإشراف — لا يستطيع صاحب الإعلان إلغاءه */
  moderated?: boolean;
};

export type Talent = BaseListing & {
  kind: "talent";
  name: string;
  /** لصياغة النصوص بالتذكير أو التأنيث فقط */
  gender?: "m" | "f";
  headline: string;
  category: CategorySlug;
  bio: string;
  skills: string[];
  seeking: Seeking[];
  experience: ExperienceLevel;
  services: { title: string; priceHint?: string }[];
  work: { image: string; caption: string }[];
  remote?: boolean;
  available: boolean;
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  image?: string;
  priceHint?: string;
};

export type Family = BaseListing & {
  kind: "family";
  name: string;
  tagline: string;
  story: string;
  categories: CategorySlug[];
  products: Product[];
  cover?: string;
  /** تستقبل طلبات المناسبات والشركات */
  events?: { capacity?: string; notice?: string };
};

export type Opportunity = BaseListing & {
  kind: "opportunity";
  title: string;
  type: OpportunityType;
  poster: { type: PosterType; name: string };
  category: CategorySlug;
  description: string;
  requirements: string[];
  when?: string;
  budget?: string;
  quantity?: string;
  remote?: boolean;
  /**
   * كل المحافظات التي تشملها الفرصة إن كانت أكثر من واحدة، وأولها governorate.
   * بدونها الفرصة في محافظة واحدة فقط.
   */
  areas?: GovernorateSlug[];
  closed?: boolean;
  /** آخر مرة أكّد فيها صاحب الفرصة أنها ما زالت متاحة */
  renewedAt?: string;
  /**
   * يستقبل المهتمين بالتقديم عبر «فرصة»: يقدّمون بملفاتهم، وصاحب الفرصة يفرزهم
   * ويتواصل مع من يختار. بدونه يتواصل المهتمون معه مباشرة.
   */
  apply?: boolean;
};

export type Listing = Talent | Family | Opportunity;

/** حالة المتقدم كما يفرزه صاحب الفرصة، ولا يراها المتقدم */
export type ApplicationStatus = "new" | "shortlisted" | "rejected";

/** تقديم على فرصة بملف موهبة أو صفحة أسرة */
export type Application = {
  id: string;
  opportunityId: string;
  /** حساب المتقدم */
  accountId: string;
  profile: { kind: "talent" | "family"; id: string };
  /** رسالة قصيرة للناشر */
  message?: string;
  status: ApplicationStatus;
  createdAt: string;
};
