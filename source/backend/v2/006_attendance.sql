create or replace function rakeeza_private.attend(a rakeeza_private.accounts,d jsonb,p jsonb) returns jsonb language plpgsql set search_path='' as $$
declare w jsonb;pr jsonb;lat float8;lng float8;accuracy float8;distance float8;today text:=to_char(now() at time zone 'Asia/Riyadh','YYYY-MM-DD');tm text:=to_char(now() at time zone 'Asia/Riyadh','HH24:MI');entry jsonb;arr jsonb;op text:=p->>'type';logs jsonb;
begin
 if a.profile->>'role'<>'worker' then raise exception 'الحضور من حساب الموظف فقط';end if;
 w:=rakeeza_private.item(d,'workers',a.profile->>'workerId');pr:=rakeeza_private.item(d,'projects',w->>'projectId');
 if pr->>'lat' is null or pr->>'lng' is null then raise exception 'المدير لم يحدد مركز نطاق الحضور للمشروع';end if;
 if not rakeeza_private.allowed(a,pr->>'id') then raise exception 'المشروع خارج الصلاحية';end if;
 lat:=rakeeza_private.num(p,'lat',-90,90);lng:=rakeeza_private.num(p,'lng',-180,180);accuracy:=rakeeza_private.num(p,'accuracy',0,100);
 if (p->>'observedAt')::timestamptz is null or abs(extract(epoch from now()-(p->>'observedAt')::timestamptz))>120 then raise exception 'تحتاج موقعًا حديثًا خلال دقيقتين';end if;
 distance:=6371000*2*asin(least(1,sqrt(power(sin(radians(lat-(pr->>'lat')::float8)/2),2)+cos(radians(lat))*cos(radians((pr->>'lat')::float8))*power(sin(radians(lng-(pr->>'lng')::float8)/2),2))));
 if distance+accuracy>650 then raise exception 'خارج نطاق المشروع أو دقة الموقع غير كافية';end if;
 select e into entry from jsonb_array_elements(coalesce(w->'attendanceLog','[]')) e where e->>'date'=today;
 entry:=coalesce(entry,jsonb_build_object('date',today,'insideGeofence',true));
 if op='clock_in' then
  if nullif(entry->>'checkIn','') is not null then raise exception 'تم تسجيل الحضور مسبقًا';end if;
  entry:=entry||jsonb_build_object('checkIn',tm);w:=w||jsonb_build_object('status','present','checkInTime',tm,'geoFenceStatus','inside_geofence');
 elsif op='clock_out' then
  if nullif(entry->>'checkIn','') is null or nullif(entry->>'checkOut','') is not null then raise exception 'سجل الحضور أولًا أو سبق تسجيل الانصراف';end if;
  entry:=entry||jsonb_build_object('checkOut',tm);
 else raise exception 'نوع حضور غير صالح';end if;
 select coalesce(jsonb_agg(e),'[]') into arr from jsonb_array_elements(coalesce(w->'attendanceLog','[]')) e where e->>'date'<>today;
 w:=w||jsonb_build_object('attendanceLog',jsonb_build_array(entry)||arr,'attendanceSource','browser_gps');d:=rakeeza_private.put(d,'workers',w);
 logs:=jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'companyId',a.company_id,'workerId',w->>'id','workerName',w->>'name','projectId',pr->>'id','type',op,'timestamp',now(),'lat',lat,'lng',lng,'accuracy',accuracy,'isInsideGeofence',true,'distanceToProjectMeters',round(distance::numeric),'code','ATT-'||gen_random_uuid()::text,'source','authenticated_browser_gps'))||coalesce(d->'attendanceLogs','[]');
 d:=jsonb_set(d,'{attendanceLogs}',logs,true);return rakeeza_private.audit(d,a,'attendance.'||op,'attendance',w);
end $$;
revoke all on all functions in schema rakeeza_private from public,anon,authenticated;
