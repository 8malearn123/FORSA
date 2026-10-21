import type { Metadata } from "next";
import Image from "next/image";
import {
  Banknote,
  ChevronDown,
  Coffee,
  Flag,
  LockKeyhole,
  MessageCircleQuestionMark,
  PenLine,
} from "lucide-react";

import { Logo, Nuqta, Sparks } from "@/components/brand";
import { HowItWorks } from "@/components/home/community";
import { AgreementScene } from "@/components/illustrations";
import { ButtonLink, Container, SectionHeading } from "@/components/ui";
import { demoEnabled } from "@/lib/demo";

export const metadata: Metadata = {
  title: "عن فرصة",
  description:
    "«فرصة» مبادرة مجتمعية مجانية تجعل مواهب جازان وأسرها المنتجة وفرصها أوضح وأقرب. تعرّف على فكرتها ومبادئها ونصائح التواصل الآمن.",
};

const SAFETY = [
  {
    icon: MessageCircleQuestionMark,
    title: "اسأل قبل ما تتفق",
    body: "اطلب نماذج من أعمال سابقة أو صوراً للمنتج، واسأل عن التفاصيل التي تهمك.",
  },
  {
    icon: Banknote,
    title: "لا تحوّل المبلغ كاملاً مقدماً",
    body: "مع شخص لا تعرفه، اتفقوا على دفعة معقولة أو الدفع عند الاستلام.",
  },
  {
    icon: PenLine,
    title: "اكتبوا الاتفاق ولو برسالة",
    body: "السعر والموعد والكمية في رسالة واتساب واضحة تحفظ حق الطرفين.",
  },
  {
    icon: LockKeyhole,
    title: "احمِ معلوماتك",
    body: "لا تشارك رموز التحقق أو كلمات المرور أو صور الهوية مع أي أحد.",
  },
  {
    icon: Coffee,
    title: "اللقاء في مكان عام",
    body: "إذا احتجتم لقاءً قبل الاتفاق، فليكن في مكان عام ووقت مناسب.",
  },
  {
    icon: Flag,
    title: "بلّغ عن أي شيء مريب",
    body: "زر «إبلاغ» موجود في كل إعلان، ونراجع البلاغات يدوياً.",
  },
];

/** شعار «فرصة» مؤقت حتى تصل الشعارات الرسمية؛ ضع كل شعار في public/partners/ وغيّر المسار هنا */
const PARTNERS = [
  { name: "قمة كود", logo: "/brand/forsa-logo.svg" },
  { name: "المصممة أثير", logo: "/brand/forsa-logo.svg" },
];

const FAQ = [
  {
    q: "هل «فرصة» مجانية؟",
    a: "نعم، بالكامل. «فرصة» مبادرة مجتمعية هدفها خدمة أهل جازان، لا الربح منهم. لا اشتراكات، ولا رسوم نشر، ولا عمولات.",
  },
  {
    q: "من يستطيع النشر على «فرصة»؟",
    a: "أي شخص عنده مهارة، أو أسرة منتجة، أو فرد أو شركة أو جهة تبحث عن أحد، داخل منطقة جازان. نبدأ بجازان ونركّز عليها.",
  },
  {
    q: "هل تتدخلون في الاتفاق أو الدفع؟",
    a: "لا. «فرصة» مساحة للاكتشاف فقط، ولا نضمن تنفيذ الطلبات. التواصل والاتفاق والدفع والتسليم كلها بينكم مباشرة، ولهذا نشجّع على اتباع نصائح التواصل الآمن.",
  },
  {
    q: "كيف أعدّل إعلاني أو أحذفه؟",
    a: "ادخل إلى «حسابي» برقم واتسابك، ويصلك رمز الدخول على واتساب. من هناك تعدّل إعلاناتك، أو تخفيها، أو تغلق الفرصة عند اكتمالها، أو تحذفها نهائياً.",
  },
  {
    q: "كيف أقدّم على فرصة؟",
    a: "في الفرص التي تستقبل التقديم، اضغط «قدّم الآن» واختر ملفك، وأضف رسالة قصيرة إن أحببت. يرى صاحب الفرصة ملفك، ويتواصل معك بالواتساب إن ناسبه. وإن لم يكن عندك ملف، أنشئه في دقائق ونرجعك للفرصة لتقدّم مباشرة.",
  },
  {
    q: "أنا شركة: كيف أفرز المتقدمين؟",
    a: "عند نشر الفرصة اختر «يقدّمون بملفاتهم، وأفرزهم أنا»، فلا يظهر رقمك لأحد. تصلك ملفات المتقدمين في «حسابي» مرتبة من الأنسب، مع ما يوافق فرصتك من كل ملف: المجال والمحافظة والمهارات. رشّح المناسبين، ثم تواصل معهم بالواتساب بضغطة.",
  },
  {
    q: "لماذا أدخل برقم واتساب؟",
    a: "حتى لا يدير إعلانك أحد غيرك. الرمز يصل إلى جوالك فقط، فلا كلمة مرور تُنسى ولا رابط يضيع. ورقم حسابك لا يظهر لأحد إلا إن وضعته وسيلة تواصل في إعلانك. ولا تعطِ رمز الدخول لأي شخص، حتى لو قال إنه من فريق «فرصة».",
  },
  {
    q: "لماذا لا تطلبون صوراً شخصية؟",
    a: "نحترم خصوصية مجتمعنا. يكفي اسمك أو كنيتك، وصور أعمالك ومنتجاتك تتكلم عنك. وبيانات تواصلك لا تظهر إلا لمن يطلبها.",
  },
  {
    demo: true,
    q: "هل الملفات المعروضة الآن حقيقية؟",
    a: "هذه النسخة التجريبية الأولى تعرض أمثلة توضيحية من وحي جازان حتى تتضح الفكرة، والتواصل معها معطّل. كل ما يُنشر من خلال «انضم» يظهر كإعلان حقيقي.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-nuqta-grid [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-60"
        />
        <Container className="relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-clay-700">
              <Nuqta className="size-2.5 text-clay-600" />
              عن فرصة
            </p>
            <h1 className="mt-4 text-4xl leading-[1.3] font-black text-ink-900 md:text-6xl">
              من جازان، ولجازان
            </h1>
            <p className="mt-6 text-lg leading-[2] text-ink-700">
              في جازان مواهب كثيرة: مصممون ومعلمات وفنيون ومصورون، وأسر منتجة تصنع بيدها أكلات وحلويات
              ومشغولات وبخوراً يفوح في البيوت. وفي جازان أيضاً ناس وشركات وجهات تبحث عنهم كل يوم… لكن الطرفين
              ما يلتقون دائماً.
            </p>
            <p className="mt-4 text-lg leading-[2] text-ink-700">
              «فرصة» مبادرة مجتمعية مجانية جاءت لتقرّب هذه المسافة: مساحة واحدة يرى فيها الجميع ما حولهم من
              فرص، ويتواصلون مباشرة، بلا وسيط ولا عمولة.
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-md pb-16">
            <figure className="relative aspect-[4/5] overflow-hidden rounded-[40px] rounded-ee-[11px] bg-sand-200">
              <Image
                src="/images/places/jazan.jpg"
                alt="قلعة الدوسرية في جازان"
                fill
                sizes="(min-width: 1024px) 448px, 90vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/40 via-transparent to-transparent" />
            </figure>
            <Sparks className="absolute -top-6 left-6 w-16" animated />
            <div className="absolute start-[-1.5rem] bottom-0 rounded-[32px] rounded-ee-[9px] bg-white px-8 py-9 shadow-lift sm:start-[-3rem]">
              <Logo className="w-40" />
            </div>
          </div>
        </Container>
      </section>

      <HowItWorks />

      <section
        id="safety"
        className="relative scroll-mt-24 overflow-hidden bg-ink-900 py-20 text-sand-50 md:py-24"
      >
        <Nuqta className="absolute -right-24 -bottom-40 hidden size-96 text-ink-800 lg:block" rotate={-90} />
        <Container className="relative grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-clay-300">
              <Nuqta className="size-2.5 text-clay-400" />
              نصائح التواصل الآمن
            </p>
            <h2 className="mt-3 text-3xl leading-[1.3] font-black md:text-[2.6rem]">تعامل وأنت مطمّن</h2>
            <p className="mt-4 max-w-md text-lg leading-[1.9] text-ink-200">
              الاتفاق بينكم مباشرة، وهذه النصائح تحفظ حق الطرفين.
            </p>
            <figure className="mt-10 max-w-md">
              <AgreementScene className="shadow-lift" />
              <figcaption className="mt-4 flex items-center gap-2 text-sm text-ink-300">
                <Nuqta className="size-2 text-sage-400" />
                مثال لاتفاق واضح: الكمية والسعر والموعد وطريقة الدفع في رسالة واحدة.
              </figcaption>
            </figure>
          </div>
          <ul>
            {SAFETY.map((tip) => (
              <li
                key={tip.title}
                className="flex gap-5 border-t border-ink-700/80 py-7 first:border-t-0 first:pt-0 last:pb-0"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-[16px] rounded-ss-[5px] bg-ink-800 text-clay-300 ring-1 ring-ink-700">
                  <tip.icon className="size-6" strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="text-xl font-bold text-sand-50">{tip.title}</h3>
                  <p className="mt-1.5 leading-[1.9] text-ink-200">{tip.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section id="partners" className="scroll-mt-24 pt-20 md:pt-24">
        <Container>
          <SectionHeading eyebrow="شركاء النجاح" title="شكراً لمن ساهم في بناء «فرصة»" />
          <ul className="mt-10 grid max-w-xl grid-cols-2 gap-4">
            {PARTNERS.map((p) => (
              <li
                key={p.name}
                className="flex flex-col items-center gap-5 rounded-[28px] rounded-ee-[8px] bg-white px-5 py-8 text-center shadow-soft ring-1 ring-ink-100"
              >
                <span className="relative h-16 w-full max-w-36">
                  <Image src={p.logo} alt="" fill sizes="144px" className="object-contain" />
                </span>
                <p className="font-display text-lg font-bold text-ink-900">{p.name}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section id="faq" className="scroll-mt-24 py-20">
        <Container>
          <div className="max-w-3xl">
            <SectionHeading eyebrow="الأسئلة الشائعة" title="أسئلة تجينا كثير" />
            <div className="mt-10 flex flex-col gap-3">
              {FAQ.filter((item) => demoEnabled() || !item.demo).map((item) => (
                <details
                  key={item.q}
                  className="group rounded-[24px] rounded-ee-[7px] bg-white px-6 py-5 ring-1 ring-ink-100 open:ring-clay-200"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-bold text-ink-900">
                    {item.q}
                    <ChevronDown className="size-5 shrink-0 text-ink-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 leading-[1.9] text-ink-700">{item.a}</p>
                </details>
              ))}
            </div>
            <div className="mt-12 flex flex-wrap gap-3">
              <ButtonLink href="/join" size="lg">
                انضم إلى فرصة
              </ButtonLink>
              <ButtonLink href="/opportunities" size="lg" variant="secondary">
                اكتشف الفرص
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
