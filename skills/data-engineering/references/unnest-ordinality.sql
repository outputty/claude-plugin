SELECT t.id, u.item, u.ord
FROM t, unnest(t.items) WITH ORDINALITY AS u(item, ord);
