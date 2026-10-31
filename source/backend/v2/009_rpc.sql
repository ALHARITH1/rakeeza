-- Keep these separate from the legacy pilot RPCs. Install only when ready for release.
create or replace function public.rakeeza_v2(token text,operation text,payload jsonb default '{}'::jsonb,expected_revision bigint default null) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 case operation
 when 'snapshot' then return rakeeza_private.snapshot_v2(token);
 when 'member.invite' then return rakeeza_private.manage_member(token,'invite',payload);
 when 'member.update' then return rakeeza_private.manage_member(token,'update',payload);
 when 'member.reset' then return rakeeza_private.manage_member(token,'reset',payload);
 when 'recovery.key' then return rakeeza_private.recovery_key(token);
 when 'backup' then return rakeeza_private.backup(token);
 when 'restore' then return rakeeza_private.restore(token,expected_revision,payload);
 else return rakeeza_private.command(token,expected_revision,operation,payload);
 end case;
end $$;
create or replace function public.rakeeza_v2_auth(operation text,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare a rakeeza_private.accounts;tok text;r jsonb;p text:=payload->>'phone';pw text:=payload->>'password';
begin
 case operation
 when 'accept' then return rakeeza_private.accept_invite(payload->>'code',pw);
 when 'recover' then return rakeeza_private.recover(p,payload->>'key',pw);
 when 'register' then return public.rakeeza_auth('register',p,pw,payload-'phone'-'password');
 when 'login' then
  if p is null or pw is null or p !~ '^05[0-9]{8}$' or length(pw)<8 or octet_length(pw)>72 then return jsonb_build_object('error','بيانات دخول غير صحيحة');end if;
  if not rakeeza_private.rate_limit('auth:'||p,30) then return jsonb_build_object('error','طلبات كثيرة؛ حاول لاحقًا');end if;
  select * into a from rakeeza_private.accounts x where x.phone=p and x.active;
  if a.id is null or extensions.crypt(pw,a.password_hash)<>a.password_hash then return jsonb_build_object('error','بيانات الدخول غير صحيحة');end if;
  tok:=encode(extensions.gen_random_bytes(32),'hex');insert into rakeeza_private.sessions values(encode(extensions.digest(tok,'sha256'),'hex'),a.id,now()+interval '7 days');return jsonb_build_object('token',tok,'companyId',a.company_id);
 else raise exception 'طلب غير صالح';end case;
end $$;
revoke all on function public.rakeeza_v2(text,text,jsonb,bigint),public.rakeeza_v2_auth(text,jsonb) from public,anon,authenticated;
-- No grants until staged tests pass. Legacy snapshot/save must also be locked down on activation.
