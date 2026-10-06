-- V7 A3: explicit emotion/need/life-situation Library taxonomy and query indexes.
-- Aliases remain an application normalization concern; persisted rows use canonical IDs only.

alter table public.v7_library_taxonomy
  drop constraint if exists v7_library_taxonomy_kind_check;

alter table public.v7_library_taxonomy
  add constraint v7_library_taxonomy_kind_check
  check (kind in ('category','topic','tag','emotion','need','life_situation'));

alter table public.v7_library_taxonomy
  drop constraint if exists v7_library_taxonomy_discovery_namespace_check;

alter table public.v7_library_taxonomy
  add constraint v7_library_taxonomy_discovery_namespace_check
  check (
    kind not in ('emotion','need','life_situation')
    or left(id, char_length(kind) + 1) = kind || '.'
  );

create index if not exists v7_library_revision_taxonomy_taxonomy_revision_idx
  on public.v7_library_revision_taxonomy(taxonomy_id, revision_id);

create index if not exists v7_library_taxonomy_kind_id_idx
  on public.v7_library_taxonomy(kind, id);

comment on constraint v7_library_taxonomy_discovery_namespace_check on public.v7_library_taxonomy is
  'Discovery aliases are never persisted: emotion, need, and life_situation rows use kind.<canonical_id>.';
