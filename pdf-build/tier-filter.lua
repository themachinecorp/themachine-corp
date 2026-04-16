-- Tier filter for pandoc: conditionally includes content based on TIER meta
-- Content blocks with data-tier-min="X" are included only if file TIER >= X
-- TIER values: basic=1, pro=2, flagship=3
function get_tier(meta)
  local t = meta.tier
  if t and t.t == 'Str' then
    return t.c
  end
  return 'basic'
end

function get_min_tier(block)
  local min = pandoc.utils.stringify(block.attributes['data-tier-min'])
  if min == '' then return nil end
  return tonumber(min)
end

function matches_tier(block, current_tier)
  local min = get_min_tier(block)
  if not min then return true end  -- no tier restriction = include always
  
  local tier_values = {basic = 1, pro = 2, flagship = 3}
  local current = tier_values[current_tier] or 1
  return current >= min
end

function Pandoc(doc)
  local meta = doc.meta
  local current_tier = get_tier(meta)
  
  -- Process blocks
  local new_blocks = {}
  for i, block in ipairs(doc.blocks) do
    if block.t == 'Div' or block.t == 'Header' or block.t == 'RawBlock' then
      if matches_tier(block, current_tier) then
        table.insert(new_blocks, block)
      end
    else
      -- Plain text/para etc - include always unless has tier attr
      if matches_tier(block, current_tier) then
        table.insert(new_blocks, block)
      end
    end
  end
  
  return pandoc.Pandoc(new_blocks, meta)
end
