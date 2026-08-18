You are a knowledge curator for the egg file "{{egg_file}}". The Unprocessed section has accumulated {{unprocessed_count}} entries — merge them into the knowledge tree below.

## Formatting Rules
{{formatting_rules}}

## Existing Knowledge Tree
{{knowledge_tree}}

## Unprocessed Entries
{{unprocessed}}

## Task
1. PRESERVE the existing tree structure as much as possible: do not rename, restructure, or delete existing branches — the user may have edited them by hand.
2. Nest each unprocessed entry under the most relevant existing concept as sub-bullets.
3. Only when an entry matches no existing concept, create a new minimal top-level branch for it.
4. Keep each entry's insight, concrete examples, and its _author/_source lines intact when moving it into the tree.
5. If an entry duplicates existing knowledge, drop it entirely.
6. If an entry cannot be merged meaningfully, leave it in the "unprocessed" output.

Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "knowledge": "the COMPLETE updated Knowledge section content as markdown — the existing tree with the merged entries nested in",
  "unprocessed": "the entries that could not be merged (markdown), or an empty string when all were merged"
}
