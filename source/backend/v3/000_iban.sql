create or replace function rakeeza_private.valid_sa_iban(s text) returns boolean language plpgsql immutable set search_path='' as $$
declare v text:=upper(replace(s,' ',''));n text;ch text;rem int:=0;i int;
begin
 if v !~ '^SA[0-9]{22}$' then return false;end if;n:=substring(v from 5)||'2810'||substring(v from 3 for 2);
 for i in 1..length(n) loop rem:=(rem*10+substring(n from i for 1)::int)%97;end loop;return rem=1;
end $$;
revoke all on function rakeeza_private.valid_sa_iban(text) from public,anon,authenticated;
