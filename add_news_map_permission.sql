INSERT INTO public.permissions (perm_key, description) 
VALUES ('edit:news_map', 'Allows editing the news events and interactive map data') 
ON CONFLICT (perm_key) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p
WHERE r.role_name IN ('admin', 'superadmin') AND p.perm_key = 'edit:news_map'
ON CONFLICT DO NOTHING;
