\set ON_ERROR_STOP on
begin;
do $$
declare pub jsonb;t text;d jsonb;v jsonb;a rakeeza_private.accounts;rev bigint;bad boolean;
begin
 pub:=public.rakeeza_auth('register','0598888851','v2-runtime-test-only','{"companyName":"Runtime","crNumber":"9876543251","adminName":"Admin"}');t:=pub->>'token';a:=rakeeza_private.actor(t);
 update rakeeza_private.companies set data=jsonb_build_object('version',2,'companyId',a.company_id,'projects','[]'::jsonb,'notifications','[]'::jsonb) where id=a.company_id;
 v:=rakeeza_private.command(t,0,'project.create','{"name":"P","code":"P","client":"C","consultant":"Q","location":"Riyadh","startDate":"2026-10-31","endDate":"2027-10-31","lat":24.71,"lng":46.67}');if v->>'revision'<>'1' then raise exception 'revision not advanced';end if;
 bad:=false;begin perform rakeeza_private.command(t,0,'project.create','{"name":"P","code":"P2","startDate":"2026-10-31","endDate":"2027-10-31"}');exception when others then bad:=true;end;if not bad then raise exception 'stale command accepted';end if;
 v:=rakeeza_private.command(t,1,'permissions.update','{"role":"site_engineer","tabs":["dpr"],"actions":["dpr.create"]}');
 if v->'data'->'rolePermissions'->'actions'->'site_engineer'<>'["dpr.create"]' then raise exception 'permission update missing';end if;
 v:=rakeeza_private.command(t,2,'company.update','{"name":"Updated","crNumber":"9876543251","brandColor":"#bf8b39","logoDataUrl":null}');if v->'company'->>'name'<>'Updated' then raise exception 'profile update failed';end if;
 raise notice 'PASS staged runtime: canonical project command, revision conflict, custom permissions, profile update';
end $$;
rollback;
