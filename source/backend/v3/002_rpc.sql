create or replace function public.rakeeza_modules(token text,operation text,payload jsonb default '{}'::jsonb) returns jsonb language sql security definer set search_path='' as $$select rakeeza_private.modules(token,operation,payload)$$;
revoke all on function public.rakeeza_modules(text,text,jsonb) from public,anon,authenticated;
