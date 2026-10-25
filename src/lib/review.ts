import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import { areasName } from "./listing";
import { getCategory, opportunityTypeName, posterTypeName } from "./taxonomy";
import type { Opportunity } from "./types";

/**
 * مراجعة الفرص بالذكاء الاصطناعي قبل نشرها: الفرصة الحقيقية تُنشر مباشرة،
 * وما يُشك فيه يُعلَّق حتى يوافق عليه فريق الإشراف.
 * تعمل فقط إن ضُبط ANTHROPIC_API_KEY، وإلا تُنشر الفرص كما كانت.
 */
export const reviewEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

const Verdict = z.object({
  decision: z.enum(["publish", "hold"]),
  /** سبب قصير بالعربية يقرؤه فريق الإشراف */
  reason: z.string(),
});

const SYSTEM = `You screen listings posted to «فرصة», a free community platform in the Jazan region of Saudi Arabia. The platform has three sections:
- Opportunities: someone (an individual, a company, or an organization) NEEDS a person, a service, or products: a job, a one-off task, a product or catering order, training, or volunteering.
- Talent profiles: people OFFER their own skills and services.
- Productive families: home businesses OFFER their products.

You receive one listing submitted to the Opportunities section. Decide whether it can be published right away, or must be held until a human moderator approves it.

Publish when it is a genuine request: the poster needs someone or something, and the listing is clear enough to act on. Short, informal, or dialect Arabic is fine. An individual hiring (a household needing a driver, a parent needing a tutor) is legitimate. Missing salary or date is fine.

Hold when any of these apply:
- The poster is offering their own services or products instead of looking for someone (for example "أقدّم خدمات…", "نوفر لكم…", "للطلب تواصل"). These belong in a talent profile or a family page.
- It is an advertisement, promotion, or spam rather than a request.
- Signs of fraud: asking applicants to pay fees or deposits, requesting bank details or ID copies up front, pay that is implausibly high for the work, pyramid or multi-level marketing schemes, or pushing people to suspicious external links.
- Illegal, sexual, discriminatory, or offensive content.
- It is too vague or meaningless to tell what is being asked.

When unsure, hold: a moderator reviews held listings quickly, while publishing a bad listing harms the community.

Write "reason" as one short sentence in Arabic for the moderators, naming the specific problem when you hold, or what the listing asks for when you publish.`;

/** نص الفرصة كما يراه المراجع. الحقول من الناشر، فتوضع بين وسوم حتى لا تُقرأ كتعليمات */
function describe(o: Opportunity) {
  return [
    `<type>${opportunityTypeName(o.type)}</type>`,
    `<poster_kind>${posterTypeName(o.poster.type)}</poster_kind>`,
    `<poster_name>${o.poster.name}</poster_name>`,
    `<title>${o.title}</title>`,
    `<category>${getCategory(o.category)?.name ?? o.category}</category>`,
    `<location>${areasName(o, { full: true })}${o.remote ? " · أو عن بُعد" : ""}</location>`,
    `<description>\n${o.description}\n</description>`,
    o.requirements.length ? `<requirements>\n${o.requirements.join("\n")}\n</requirements>` : "",
    o.when ? `<when>${o.when}</when>` : "",
    o.quantity ? `<quantity>${o.quantity}</quantity>` : "",
    o.budget ? `<budget>${o.budget}</budget>` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export type ReviewResult = { pending?: { reason: string; at: string } };

let client: Anthropic | undefined;

/**
 * يراجع الفرصة ويرجع pending إن وجب تعليقها. أي تعذّر في المراجعة (خطأ أو رفض أو رد غير مفهوم)
 * يعلّق الفرصة للمراجعة اليدوية بدل نشرها دون تحقق.
 */
export async function reviewOpportunity(o: Opportunity): Promise<ReviewResult> {
  if (!reviewEnabled()) return {};
  const hold = (reason: string): ReviewResult => ({ pending: { reason, at: new Date().toISOString() } });
  try {
    client ??= new Anthropic({ timeout: 30_000, maxRetries: 1 });
    const response = await client.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      system: SYSTEM,
      output_config: { effort: "low", format: zodOutputFormat(Verdict) },
      messages: [{ role: "user", content: describe(o) }],
    });
    if (response.stop_reason === "refusal") return hold("لم تكتمل المراجعة الآلية، تحتاج مراجعة يدوية.");
    const verdict = response.parsed_output;
    if (!verdict) return hold("لم تكتمل المراجعة الآلية، تحتاج مراجعة يدوية.");
    return verdict.decision === "publish" ? {} : hold(verdict.reason.slice(0, 300));
  } catch (error) {
    console.error("[forsa] opportunity review failed", error);
    return hold("تعذّرت المراجعة الآلية، تحتاج مراجعة يدوية.");
  }
}
