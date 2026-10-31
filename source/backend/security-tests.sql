\set ON_ERROR_STOP on
begin;
do $$
declare a jsonb;b jsonb;r jsonb;s jsonb; aid uuid;bid uuid;t text;i int;rol text;
begin
 a:=public.rakeeza_auth('register','0599999901','local-test-only-A', '{"companyName":"Isolation A","crNumber":"9999999901","adminName":"A admin"}');
 b:=public.rakeeza_auth('register','0599999902','local-test-only-B', '{"companyName":"Isolation B","crNumber":"9999999902","adminName":"B admin"}');
 aid:=(a->>'companyId')::uuid;bid:=(b->>'companyId')::uuid;t:=a->>'token';
 if aid=bid then raise exception 'tenant IDs collide';end if;
 r:=public.rakeeza_save(t,0,jsonb_build_object('companyId',aid,'marker','privateA'));if (r->>'revision')::int<>1 then raise exception 'revision failure';end if;
 s:=public.rakeeza_snapshot(b->>'token');if (s->'data')?'marker' then raise exception 'cross tenant read';end if;
 begin perform public.rakeeza_save(t,1,jsonb_build_object('companyId',bid,'marker','attack'));raise exception 'TEST FAILED wrong tenant accepted';exception when others then if sqlerrm like 'TEST FAILED%' then raise;end if;end;
 begin perform public.rakeeza_save(t,1,'{}');raise exception 'TEST FAILED missing tenant accepted';exception when others then if sqlerrm like 'TEST FAILED%' then raise;end if;end;
 begin perform public.rakeeza_save(t,0,jsonb_build_object('companyId',aid));raise exception 'TEST FAILED stale revision accepted';exception when others then if sqlerrm like 'TEST FAILED%' then raise;end if;end;
 begin perform public.rakeeza_snapshot('invented');raise exception 'TEST FAILED forged token accepted';exception when others then if sqlerrm like 'TEST FAILED%' then raise;end if;end;
 r:=public.rakeeza_auth('login','0599999901','local-test-only-A');s:=public.rakeeza_snapshot(r->>'token');if s->'data'->>'marker'<>'privateA' then raise exception 'second session did not share data';end if;
 -- Changing client role fields never changes server account authority.
 foreach rol in array array['project_manager','site_engineer','safety_officer','qaqc_manager','procurement_mgr','hr_manager','worker','owner','consultant','subcontractor','supplier'] loop
 update rakeeza_private.accounts set profile=profile||jsonb_build_object('role',rol) where company_id=aid;
 begin perform public.rakeeza_save(t,1,jsonb_build_object('companyId',aid,'role','executive_director'));raise exception 'TEST FAILED unenabled role wrote data';exception when others then if sqlerrm like 'TEST FAILED%' then raise;end if;end;
 begin perform public.rakeeza_snapshot(t);raise exception 'TEST FAILED unenabled role read data';exception when others then if sqlerrm like 'TEST FAILED%' then raise;end if;end;
 end loop;
 update rakeeza_private.accounts set profile=profile||'{"role":"executive_director"}' where company_id=aid;
 update rakeeza_private.accounts set active=false where company_id=aid;
 begin perform public.rakeeza_snapshot(t);raise exception 'TEST FAILED inactive account read';exception when others then if sqlerrm like 'TEST FAILED%' then raise;end if;end;
 update rakeeza_private.accounts set active=true where company_id=aid;
 perform public.rakeeza_logout(t);
 begin perform public.rakeeza_snapshot(t);raise exception 'TEST FAILED logout token valid';exception when others then if sqlerrm like 'TEST FAILED%' then raise;end if;end;
 for i in 1..31 loop r:=public.rakeeza_auth('login','0599999901','wrong-local-only');end loop;
 if r->>'error' not like '%ساعة%' then raise exception 'auth throttle missing';end if;
 if exists(select 1 from rakeeza_private.accounts where password_hash not like '$2a$%' and company_id in(aid,bid)) then raise exception 'passwords not bcrypt';end if;
 if not exists(select 1 from rakeeza_private.versions where company_id=aid and revision=0) then raise exception 'version history missing';end if;
 if has_table_privilege('anon','rakeeza_private.accounts','SELECT') or has_schema_privilege('anon','rakeeza_private','USAGE') then raise exception 'private tables exposed';end if;
 raise notice 'PASS: separate tenants, cross-tenant/missing-tenant/stale writes denied, forged/disabled/logged-out tokens denied, second session shared state, server role checked, bcrypt, throttling, history, private tables';
end $$;
rollback;
