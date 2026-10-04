import { libraryError } from './contracts.js';
import { createLibraryRepository } from './repository.js';

const TRANSLATION_COLUMNS = [
  'id', 'locale', 'title', 'summary', 'body', 'translated_from_revision_id',
  'translator', 'review_status', 'reviewer_id', 'reviewed_at',
].join(',');

const TAXONOMY_COLUMNS = [
  'display_order',
  'taxonomy:v7_library_taxonomy!v7_library_revision_taxonomy_taxonomy_id_fkey(id,kind,labels)',
].join(',');

const REVISION_COLUMNS = [
  'id', 'item_id', 'revision_number', 'source_locale', 'title', 'summary', 'body',
  'reading_minutes', 'source_kind', 'source_title', 'source_uri', 'source_catalog_id',
  'source_revision', 'source_date', 'source_checksum', 'creator',
  'originating_organization', 'rights_status', 'rights_holder', 'rights_basis',
  'attribution', 'allowed_uses', 'publication_state', 'review_status', 'reviewer_id',
  'reviewed_at', 'revision_history', 'derivatives',
  `translations:v7_library_translations!v7_library_translations_revision_id_fkey(${TRANSLATION_COLUMNS})`,
  `taxonomy_links:v7_library_revision_taxonomy!v7_library_revision_taxonomy_revision_id_fkey(${TAXONOMY_COLUMNS})`,
];

const LIST_REVISION_COLUMNS = REVISION_COLUMNS.filter(column => column !== 'body')
  .map(column => column.startsWith('translations:') ? column.replace(',body,', ',') : column)
  .join(',');

const ITEM_COLUMNS = [
  'id', 'content_type', 'current_revision_id', 'publication_state', 'updated_at',
];

function columnsFor({ includeBody = false } = {}) {
  const revisionColumns = includeBody ? REVISION_COLUMNS : LIST_REVISION_COLUMNS;
  return `${ITEM_COLUMNS.join(',')},revision:v7_library_revisions!v7_library_items_current_revision_fk!inner(${revisionColumns})`;
}

function publishedQuery(client, { includeBody = false } = {}) {
  return client.from('v7_library_items')
    .select(columnsFor({ includeBody }))
    .eq('publication_state', 'published')
    .eq('revision.publication_state', 'published')
    .eq('revision.review_status', 'approved')
    .eq('revision.rights_status', 'verified')
    .neq('revision.source_kind', 'fixture')
    .eq('revision.translations.review_status', 'reviewed');
}

function safeSearchPattern(value) {
  const query = String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 120);
  return query ? `%${query.replace(/[\\%*_]/g, character => `\\${character}`)}%` : '';
}

function mapTranslation(row, revisionId) {
  if (row.translated_from_revision_id !== revisionId) return null;
  return {
    locale: row.locale,
    reviewStatus: row.review_status,
    translatedFromRevision: row.translated_from_revision_id,
    translatedBy: row.translator,
    reviewedBy: row.reviewer_id,
    reviewedAt: row.reviewed_at,
    content: { title: row.title, summary: row.summary, body: row.body },
  };
}

function mapTaxonomyLink(row) {
  const entry = row.taxonomy;
  if (!entry) throw libraryError('Published Library taxonomy link is incomplete.', 'BQ_LIBRARY_TAXONOMY');
  return {
    id: entry.id,
    kind: entry.kind,
    order: row.display_order,
    labels: entry.labels,
  };
}

function mapPublishedRow(row) {
  const revision = row?.revision;
  if (!row?.id || !row.current_revision_id || !revision
      || revision.id !== row.current_revision_id || revision.item_id !== row.id) {
    throw libraryError('Published Library item is missing its current revision.', 'BQ_LIBRARY_REVISION');
  }

  const translations = (revision.translations ?? [])
    .filter(translation => translation.review_status === 'reviewed')
    .map(translation => mapTranslation(translation, revision.id))
    .filter(Boolean);

  return {
    id: row.id,
    contentType: row.content_type,
    publishedRevisionId: revision.id,
    publicationState: row.publication_state,
    title: revision.title,
    summary: revision.summary,
    locale: revision.source_locale,
    sourceLocale: revision.source_locale,
    readingMinutes: revision.reading_minutes,
    updatedAt: row.updated_at,
    source: {
      kind: revision.source_kind,
      title: revision.source_title,
      uri: revision.source_uri,
      catalogId: revision.source_catalog_id,
      revision: revision.source_revision,
      date: revision.source_date,
      checksum: revision.source_checksum,
      creator: revision.creator,
      organization: revision.originating_organization,
    },
    sourceContent: { title: revision.title, summary: revision.summary, body: revision.body },
    rights: {
      status: revision.rights_status,
      holder: revision.rights_holder,
      basis: revision.rights_basis,
      attribution: revision.attribution,
      allowedUses: revision.allowed_uses,
    },
    review: {
      status: revision.review_status,
      reviewer: revision.reviewer_id,
      decidedAt: revision.reviewed_at,
    },
    taxonomyLinks: (revision.taxonomy_links ?? []).map(mapTaxonomyLink),
    translations,
    revisionHistory: revision.revision_history ?? [],
    derivatives: revision.derivatives ?? [],
  };
}

function validPageSize(value) {
  const limit = Math.floor(Number(value) || 24);
  return Math.max(1, Math.min(60, limit));
}

function decodeOffset(cursor) {
  if (cursor === null || cursor === undefined || cursor === '') return 0;
  const offset = Number(cursor);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 1_000_000) {
    throw libraryError('Library page cursor is invalid.', 'BQ_LIBRARY_CURSOR');
  }
  return offset;
}

export function createLibrarySupabaseAdapter(clientOrProvider) {
  const getClient = typeof clientOrProvider === 'function'
    ? clientOrProvider
    : async () => clientOrProvider;

  async function client() {
    const value = await getClient();
    if (typeof value?.from !== 'function') {
      throw libraryError('Library requires an authenticated Supabase client.', 'BQ_LIBRARY_CLIENT');
    }
    return value;
  }

  return Object.freeze({
    async listPublished(options = {}) {
      const limit = validPageSize(options.limit);
      const offset = decodeOffset(options.cursor);
      const db = await client();
      let request = publishedQuery(db)
        .order('updated_at', { ascending: false })
        .order('id', { ascending: true });

      if (options.contentType) request = request.eq('content_type', String(options.contentType));
      const pattern = safeSearchPattern(options.query);
      if (pattern) request = request.ilike('revision.title', pattern);

      const { data, error } = await request.range(offset, offset + limit);
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      const hasMore = rows.length > limit;
      return Object.freeze({
        items: Object.freeze(rows.slice(0, limit).map(mapPublishedRow)),
        nextCursor: hasMore ? String(offset + limit) : null,
      });
    },

    async getPublishedById(id) {
      const db = await client();
      const { data, error } = await publishedQuery(db, { includeBody: true })
        .eq('id', String(id))
        .maybeSingle();
      if (error) throw error;
      return data ? mapPublishedRow(data) : null;
    },
  });
}

export function createLibrarySupabaseRepository(clientOrProvider) {
  return createLibraryRepository(createLibrarySupabaseAdapter(clientOrProvider));
}
