<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Admin access is enforced by database RLS via `public.is_owner()` (role in `user_roles`); UI guards on `/admin` are convenience only. First owner is provisioned once via `claim_initial_owner()`.
- Uploaded media lives in the private `media` bucket (public buckets are blocked by workspace policy); store long-lived signed URLs in rows.
- Public storefront reads go through query options in `src/lib/store.ts` with SSR query hydration; price/discount/WhatsApp rules live in `src/lib/pricing.ts` with tests.
