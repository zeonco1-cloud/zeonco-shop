
create type public.app_role as enum ('owner');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_owner() returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and public.has_role(auth.uid(), 'owner')
$$;

create or replace function public.owner_exists() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where role = 'owner')
$$;

-- First-run provisioning: only succeeds if no owner exists yet.
create or replace function public.claim_initial_owner() returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  perform pg_advisory_xact_lock(424242);
  if exists (select 1 from public.user_roles where role = 'owner') then
    return false;
  end if;
  insert into public.user_roles (user_id, role) values (auth.uid(), 'owner');
  return true;
end $$;
revoke execute on function public.claim_initial_owner() from public, anon;
grant execute on function public.claim_initial_owner() to authenticated;
grant execute on function public.owner_exists() to anon, authenticated;
grant execute on function public.is_owner() to anon, authenticated;

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- Categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  image_url text,
  sort_order int not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "public read visible categories" on public.categories for select using (visible or public.is_owner());
create policy "owner write categories" on public.categories for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- Products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  short_description text not null default '',
  description text not null default '',
  fabric text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  original_price numeric(10,2) check (original_price is null or original_price >= 0),
  price numeric(10,2) not null check (price >= 0),
  currency text not null default 'INR',
  sizes text[] not null default '{}',
  colors jsonb not null default '[]'::jsonb,
  stock_status text not null default 'in_stock' check (stock_status in ('in_stock','low_stock','out_of_stock')),
  published boolean not null default false,
  hidden_when_oos boolean not null default false,
  is_new boolean not null default false,
  is_featured boolean not null default false,
  featured_label text not null default '',
  on_sale boolean not null default false,
  in_rail boolean not null default false,
  rail_order int not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint price_le_original check (original_price is null or price <= original_price)
);
create index products_category_idx on public.products(category_id);
create index products_created_idx on public.products(created_at desc);
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "public read published products" on public.products for select using (published or public.is_owner());
create policy "owner write products" on public.products for all to authenticated using (public.is_owner()) with check (public.is_owner());

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images(product_id, sort_order);
grant select on public.product_images to anon, authenticated;
grant insert, update, delete on public.product_images to authenticated;
grant all on public.product_images to service_role;
alter table public.product_images enable row level security;
create policy "public read images of visible products" on public.product_images for select using (
  exists (select 1 from public.products p where p.id = product_id and (p.published or public.is_owner())));
create policy "owner write product images" on public.product_images for all to authenticated using (public.is_owner()) with check (public.is_owner());

create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  alt text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.gallery_images to anon, authenticated;
grant insert, update, delete on public.gallery_images to authenticated;
grant all on public.gallery_images to service_role;
alter table public.gallery_images enable row level security;
create policy "public read gallery" on public.gallery_images for select using (true);
create policy "owner write gallery" on public.gallery_images for all to authenticated using (public.is_owner()) with check (public.is_owner());

create table public.store_settings (
  id int primary key default 1 check (id = 1),
  store_name text not null default 'ZEON.CO',
  tagline text not null default 'Street Culture Redefined.',
  logo_url text,
  whatsapp_number text not null default '',
  currency text not null default 'INR',
  announcement_text text not null default 'New season drop — explore the collection',
  announcement_enabled boolean not null default true,
  hero_headline text not null default 'OWN YOUR EVERYDAY.',
  hero_subtext text not null default 'Streetwear built for the city — clean cuts, heavy fabrics, zero noise.',
  hero_image_url text,
  hero_cta_text text not null default 'SHOP THE COLLECTION',
  hero_cta_link text not null default '/shop',
  show_new_arrivals boolean not null default true,
  show_best_sellers boolean not null default true,
  show_sale boolean not null default true,
  show_rail boolean not null default true,
  show_gallery boolean not null default true,
  delivery_info text not null default '',
  contact_email text not null default '',
  contact_phone text not null default '',
  contact_address text not null default '',
  instagram_url text not null default '',
  facebook_url text not null default '',
  youtube_url text not null default '',
  x_url text not null default '',
  size_guide jsonb not null default '{}'::jsonb,
  about_text text not null default '',
  privacy_text text not null default '',
  terms_text text not null default '',
  seo_title text not null default 'ZEON.CO — Street Culture Redefined',
  seo_description text not null default 'Premium streetwear and casual essentials from ZEON.CO.',
  updated_at timestamptz not null default now()
);
create trigger settings_touch before update on public.store_settings for each row execute function public.touch_updated_at();
grant select on public.store_settings to anon, authenticated;
grant update on public.store_settings to authenticated;
grant all on public.store_settings to service_role;
alter table public.store_settings enable row level security;
create policy "public read settings" on public.store_settings for select using (true);
create policy "owner update settings" on public.store_settings for update to authenticated using (public.is_owner()) with check (public.is_owner());

insert into public.store_settings (id, size_guide) values (1, '{
 "tops": {"label":"T-Shirts & Shirts","unit":"cm","columns":["Size","Chest","Length","Shoulder"],"rows":[["S","96","69","44"],["M","102","71","46"],["L","108","73","48"],["XL","114","75","50"]]},
 "bottoms": {"label":"Jeans","unit":"cm","columns":["Size","Waist","Hip","Inseam"],"rows":[["28","72","92","78"],["30","77","97","79"],["32","82","102","80"],["34","87","107","81"]]}
}'::jsonb);

insert into public.categories (name, slug, image_url, sort_order) values
 ('T-Shirts','t-shirts','/demo/cat-tshirts.jpg',1),
 ('Shirts','shirts','/demo/cat-shirts.jpg',2),
 ('Jeans','jeans','/demo/cat-jeans.jpg',3),
 ('Accessories','accessories','/demo/cat-accessories.jpg',4);

with c as (select id, slug from public.categories)
insert into public.products (name, slug, short_description, description, fabric, category_id, original_price, price, sizes, colors, stock_status, published, is_new, is_featured, featured_label, on_sale, in_rail, rail_order, is_demo)
values
 ('Heavyweight Box Tee — Black','heavyweight-box-tee-black','Boxy fit, dropped shoulders.','A heavyweight boxy tee with dropped shoulders and a thick ribbed collar. Demo product — replace with real inventory.','100% cotton, 240 GSM',(select id from c where slug='t-shirts'),1499,1199,'{S,M,L,XL}','[{"name":"Black","hex":"#1d1b19"}]','in_stock',true,true,true,'Owner pick',true,true,1,true),
 ('Washed Box Tee — Sand','washed-box-tee-sand','Garment-washed, relaxed fit.','Garment-washed relaxed tee in a warm sand tone. Demo product.','100% cotton, 220 GSM',(select id from c where slug='t-shirts'),null,999,'{S,M,L,XL}','[{"name":"Sand","hex":"#d8c7ad"}]','in_stock',true,true,false,'',false,true,2,true),
 ('Overshirt — Espresso','overshirt-espresso','Utility overshirt with chest pockets.','A structured utility overshirt with twin chest pockets. Demo product.','Cotton twill',(select id from c where slug='shirts'),2499,1999,'{M,L,XL}','[{"name":"Espresso","hex":"#4a3528"}]','low_stock',true,true,true,'Featured',true,true,3,true),
 ('Relaxed Linen Shirt — Cream','relaxed-linen-shirt-cream','Breathable camp-collar shirt.','Camp-collar shirt in a breathable linen blend. Demo product.','55% linen, 45% cotton',(select id from c where slug='shirts'),null,1799,'{S,M,L}','[{"name":"Cream","hex":"#efe6d6"}]','in_stock',true,false,false,'',false,true,4,true),
 ('Baggy Denim — Washed Black','baggy-denim-washed-black','Wide-leg baggy jeans.','Wide-leg baggy jeans in a faded black wash. Demo product.','100% cotton denim, 13 oz',(select id from c where slug='jeans'),2999,2499,'{28,30,32,34}','[{"name":"Washed Black","hex":"#2e2e2e"}]','in_stock',true,true,true,'Featured',true,true,5,true),
 ('Straight Denim — Light Blue','straight-denim-light-blue','Straight-leg classic wash.','A straight-leg jean in a light vintage wash. Demo product.','100% cotton denim, 12 oz',(select id from c where slug='jeans'),null,2299,'{30,32,34}','[{"name":"Light Blue","hex":"#a9bccf"}]','out_of_stock',true,false,false,'',false,true,6,true),
 ('Logo Cap — Black','logo-cap-black','Six-panel cotton cap.','Six-panel cotton cap with embroidered wordmark. Demo product.','Cotton twill',(select id from c where slug='accessories'),null,699,'{One Size}','[{"name":"Black","hex":"#1d1b19"},{"name":"Beige","hex":"#d8c7ad"}]','in_stock',true,true,false,'',false,false,0,true);

insert into public.product_images (product_id, url, alt, sort_order)
select p.id, v.url, p.name, 0 from public.products p join (values
 ('heavyweight-box-tee-black','/demo/tee-black.png'),
 ('washed-box-tee-sand','/demo/tee-sand.png'),
 ('overshirt-espresso','/demo/shirt-espresso.png'),
 ('relaxed-linen-shirt-cream','/demo/shirt-cream.png'),
 ('baggy-denim-washed-black','/demo/jeans-black.png'),
 ('straight-denim-light-blue','/demo/jeans-blue.png'),
 ('logo-cap-black','/demo/cap-black.png')) v(slug,url) on v.slug = p.slug;

insert into public.gallery_images (url, alt, sort_order) values
 ('/demo/hero.jpg','ZEON.CO campaign',1),
 ('/demo/cat-tshirts.jpg','Tees',2),
 ('/demo/cat-jeans.jpg','Denim',3),
 ('/demo/cat-shirts.jpg','Shirts',4),
 ('/demo/cat-accessories.jpg','Accessories',5),
 ('/demo/gallery-street.jpg','Street look',6);

-- Storage policies for media bucket (bucket created separately)
create policy "public read media" on storage.objects for select using (bucket_id = 'media');
create policy "owner insert media" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_owner());
create policy "owner update media" on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_owner());
create policy "owner delete media" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_owner());
