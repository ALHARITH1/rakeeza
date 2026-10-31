-- Apply only after production-role and browser validation. Legacy writes cannot bypass approvals.
create or replace function public.rakeeza_save(token text,expected_revision bigint,data jsonb,profile jsonb default null) returns jsonb language plpgsql security definer set search_path='' as $$
begin raise exception 'تم تحديث المنصة. افتح النسخة الجديدة ثم سجل الدخول؛ حفظ النسخة القديمة موقوف لحماية مسارات الاعتماد';end $$;
grant execute on function public.rakeeza_v2(text,text,jsonb,bigint),public.rakeeza_v2_auth(text,jsonb) to anon,authenticated;
notify pgrst,'reload schema';
