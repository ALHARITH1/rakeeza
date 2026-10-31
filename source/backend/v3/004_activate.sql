-- Reviewed module RPC only. Does not alter v2 workflows or their grants.
grant execute on function public.rakeeza_modules(text,text,jsonb) to anon,authenticated;
notify pgrst,'reload schema';
