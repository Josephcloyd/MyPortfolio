drop policy if exists "Portfolio admins can update portfolio items" on public.portfolio_items;

create policy "Portfolio admins can update portfolio items"
on public.portfolio_items for update to authenticated
using (public.is_portfolio_admin_mfa())
with check (public.is_portfolio_admin_mfa());
