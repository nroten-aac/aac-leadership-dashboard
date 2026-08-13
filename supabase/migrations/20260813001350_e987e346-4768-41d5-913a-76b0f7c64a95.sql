insert into public.user_tab_permissions (user_id, tab_name)
select '1a9f8c4d-0d13-4e2e-9e50-73b0b2034788', t
from unnest(array['dashboard','members','attendance','giving','discipleship','projects']) t
on conflict do nothing;

update public.invitations set status='accepted', accepted_at=now()
where email='newmanjordanc@gmail.com' and status='pending';