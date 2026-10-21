import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, HandCoins, HeartHandshake, MapPinned, ShieldCheck } from "lucide-react";

import { formatNumber } from "@/lib/format";
import { GOVERNORATES, type GovernorateSlug } from "@/lib/taxonomy";

import { Nuqta, Sparks } from "../brand";
import { ChatScene, PostScene, SearchScene } from "../illustrations";
import { ButtonLink, Container, SectionHeading, Spark } from "../ui";

const FEATURED_AREAS = [
  {
    slug: "farasan",
    title: "فرسان",
    caption: "البحر والشعاب وأهل الجزيرة",
    image: "/images/places/farasan.jpg",
  },
  {
    slug: "fifa",
    title: "فيفاء",
    caption: "الجبال والمدرجات والبن الخولاني",
    image: "/images/places/fifa.jpg",
  },
] as const;

export function Areas({ counts }: { counts: Record<GovernorateSlug, number> }) {
  const rest = GOVERNORATES.filter((g) => !FEATURED_AREAS.some((f) => f.slug === g.slug)).sort(
    (a, b) => counts[b.slug] - counts[a.slug],
  );
  return (
    <section className="relative overflow-hidden bg-sand-200 py-16 md:py-24">
      <div aria-hidden="true" className="absolute inset-0 bg-nuqta-grid" />
      <Container className="relative">
        <SectionHeading
          eyebrow="اكتشف حسب المحافظة"
          title="من فرسان إلى فيفاء… الفرص في كل مكان"
          description="«فرصة» لكل منطقة جازان: من الساحل إلى الجبال. اختر محافظتك وشوف وش حولك."
        />
        <div className="mt-12 grid gap-4 lg:grid-cols-[1fr_1fr_1.25fr]">
          {FEATURED_AREAS.map((a) => (
            <Link
              key={a.slug}
              href={`/search?area=${a.slug}`}
              className="group relative isolate flex min-h-[300px] flex-col justify-end overflow-hidden rounded-[32px] rounded-ee-[9px] p-6 text-white"
            >
              <Image
                src={a.image}
                alt={a.caption}
                fill
                sizes="(min-width: 1024px) 400px, 100vw"
                className="-z-10 object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950/80 via-ink-950/20 to-transparent" />
              <p className="font-display text-4xl font-black">{a.title}</p>
              <p className="mt-1 text-sand-100">{a.caption}</p>
              <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                {formatNumber(counts[a.slug])} على فرصة
                <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              </p>
            </Link>
          ))}
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {rest.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/search?area=${g.slug}`}
                  className="group flex h-full items-center justify-between gap-2 rounded-2xl rounded-ee-[6px] bg-white/80 px-4 py-3.5 ring-1 ring-sand-300 transition-colors hover:bg-white hover:ring-clay-200"
                >
                  <span className="font-display font-bold text-ink-900 group-hover:text-clay-700">
                    {g.name}
                  </span>
                  {counts[g.slug] > 0 ? (
                    <span className="text-sm text-ink-500 tabular-nums">{formatNumber(counts[g.slug])}</span>
                  ) : (
                    <span className="text-xs font-semibold text-sage-700">كن الأول</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

const STEPS = [
  {
    title: "اعرض ما عندك",
    body: "أنشئ ملفك أو انشر فرصتك في دقائق، برقم واتسابك وبدون كلمات مرور.",
    Scene: PostScene,
  },
  {
    title: "يكتشفك الناس",
    body: "يبحث أهل جازان وشركاتها حسب المهارة والمنتج والمحافظة، فيصلون إليك.",
    Scene: SearchScene,
  },
  {
    title: "تواصلوا مباشرة",
    body: "بالواتساب أو الاتصال. الاتفاق بينكم، و«فرصة» لا تتدخل ولا تأخذ أي عمولة.",
    Scene: ChatScene,
  },
];

const PRINCIPLES = [
  { icon: HeartHandshake, title: "مجانية بالكامل", body: "مبادرة مجتمعية، بلا اشتراكات ولا رسوم." },
  { icon: HandCoins, title: "بلا وسيط ولا عمولة", body: "لا نتدخل في الاتفاق ولا في الدفع." },
  { icon: MapPinned, title: "جازان أولاً", body: "نبدأ من منطقة جازان، ومع أهلها." },
  { icon: ShieldCheck, title: "خصوصيتك محفوظة", body: "لا نطلب صوراً شخصية، والتواصل بيدك." },
];

export function HowItWorks() {
  return (
    <section className="py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="كيف تعمل فرصة؟"
          title={
            <>
              نعرّفكم على&nbsp;بعض… والباقي <Spark>بينكم</Spark>
            </>
          }
          description="ما نبيع ولا نشتري. نحن فقط نقرّب المسافة بين من يملك المهارة ومن يحتاجها."
        />
        <ol className="mt-12 grid gap-5 lg:grid-cols-3 lg:gap-6">
          {STEPS.map(({ title, body, Scene }, i) => (
            <li
              key={title}
              className="relative grid gap-2 rounded-[32px] rounded-ee-[9px] bg-white p-3 shadow-soft ring-1 ring-ink-100 md:grid-cols-2 md:items-center lg:grid-cols-1 lg:items-start"
            >
              <Scene />
              <div className="px-4 pt-3 pb-4 md:px-5">
                <div className="flex items-center gap-3">
                  <span className="relative grid shrink-0 place-items-center">
                    <Nuqta className="size-10 text-clay-100" rotate={-90} />
                    <span className="absolute font-display text-lg font-black text-clay-600">
                      {formatNumber(i + 1)}
                    </span>
                  </span>
                  <h3 className="text-2xl font-extrabold text-ink-900">{title}</h3>
                </div>
                <p className="mt-3 leading-[1.9] text-ink-600">{body}</p>
              </div>
              {i < STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute -end-[30px] top-[106px] z-10 hidden size-9 place-items-center rounded-full bg-white text-clay-600 shadow-soft ring-1 ring-ink-100 lg:grid"
                >
                  <ArrowLeft className="size-4" />
                </span>
              ) : null}
            </li>
          ))}
        </ol>
        <ul className="mt-5 grid gap-6 rounded-[32px] rounded-ee-[9px] bg-sage-100 p-6 sm:grid-cols-2 md:p-8 lg:grid-cols-4">
          {PRINCIPLES.map((p) => (
            <li key={p.title} className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-[14px] rounded-ss-[5px] bg-white text-sage-700 shadow-soft">
                <p.icon className="size-5" strokeWidth={1.75} />
              </span>
              <div>
                <h3 className="font-display text-lg font-bold text-sage-950">{p.title}</h3>
                <p className="mt-0.5 text-sm leading-relaxed text-sage-900/75">{p.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="pb-16 md:pb-24">
      <Container>
        <div className="relative overflow-hidden rounded-[40px] rounded-ee-[11px] bg-ink-900 px-8 py-16 text-center text-sand-50 md:px-16 md:py-20">
          <Nuqta className="absolute -bottom-24 -left-16 size-80 text-ink-800" rotate={-90} />
          <Nuqta className="absolute -top-10 right-10 size-24 text-clay-600/40" rotate={-90} />
          <Sparks className="absolute top-10 left-[18%] w-16" animated />
          <h2 className="relative mx-auto max-w-4xl text-4xl leading-[1.3] font-black md:text-6xl">
            جازان مليانة مواهب…
            <br />
            <span className="text-clay-300">وأنت منها</span>
          </h2>
          <p className="relative mx-auto mt-5 max-w-xl text-lg text-ink-200">
            عندك مهارة؟ عندكم منتج؟ تدوّر أحد يساعدك؟ مكانك هنا، ومجاناً.
          </p>
          <div className="relative mt-9 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/join" size="lg">
              أضف فرصتك الآن
            </ButtonLink>
            <ButtonLink href="/opportunities" size="lg" variant="secondary">
              اكتشف الفرص
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
