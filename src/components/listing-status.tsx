import { isStale } from "@/lib/listing";
import type { Listing } from "@/lib/types";

import { Badge } from "./ui";

/** حالة الإعلان كما يراها صاحبه: ظاهر، أو مخفي، أو أخفاه الإشراف، ومعها حالة الفرصة */
export function ListingStatus({ listing }: { listing: Listing }) {
  return (
    <>
      {listing.moderated ? (
        <Badge tone="clay">أخفاه فريق الإشراف</Badge>
      ) : listing.pending ? (
        <Badge tone="sand">بانتظار موافقة فريق فرصة</Badge>
      ) : listing.hidden ? (
        <Badge tone="sand">مخفي حالياً</Badge>
      ) : (
        <Badge tone="sage" dot>
          ظاهر للجميع
        </Badge>
      )}
      {listing.kind === "opportunity" && listing.closed ? <Badge tone="sand">مغلقة</Badge> : null}
      {listing.kind === "opportunity" && isStale(listing) ? <Badge tone="clay">قد تكون انتهت</Badge> : null}
    </>
  );
}
