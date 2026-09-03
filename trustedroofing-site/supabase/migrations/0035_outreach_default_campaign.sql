insert into outreach_campaigns (name, active, daily_new_prospect_limit)
select 'Canadian Roofing SEO - Managed', false, 15
where not exists (select 1 from outreach_campaigns where name = 'Canadian Roofing SEO - Managed');

with campaign as (
  select id from outreach_campaigns where name = 'Canadian Roofing SEO - Managed' limit 1
)
insert into outreach_campaign_steps (campaign_id, step_number, delay_days, subject_template, text_template)
select campaign.id, s.step_number, s.delay_days, s.subject_template, s.text_template
from campaign
cross join (values
  (1, 0, 'A different approach to roofing SEO for {{company}}',
   'Hi {{contact}},\n\nI’m reaching out because I built an SEO infrastructure system specifically around service businesses, with roofing being the first market I proved it in.\n\nI took a new roofing website with essentially no domain authority and moved it into consistent page-one visibility for competitive roofing searches using programmatic local SEO architecture, project and geographic signals, structured data, automated internal linking and ongoing content infrastructure.\n\nI’m now opening the managed system to roofing companies outside Calgary. The managed website SEO program is $2,500/month and includes the underlying Trusted Engine architecture plus ongoing website SEO work and an integrated instant quote system configured around your pricing.\n\n{{observation}}\n\nIf it is worth a look, I can show you the Calgary results and what I would change on {{company}}’s current search setup.\n\nPeter\nTrusted Exteriors SEO'),
  (2, 4, 'One thing I noticed about {{company}}',
   'Hi {{contact}},\n\nI wanted to follow up with something specific rather than just bumping my last email.\n\n{{observation}}\n\nThat is the type of gap the Trusted Engine is built around: service-area architecture, project/location signals, schema and internal linking are tied together so the site builds stronger local relevance over time instead of relying only on individual pages.\n\nIf you want, I can walk you through what I would implement for {{company}}.\n\nPeter'),
  (3, 9, 'The roofing SEO result behind the system',
   'Hi {{contact}},\n\nThe reason I reached out is that this is not a theoretical SEO package. I built the approach around a new Calgary roofing domain and used it to reach page-one visibility across competitive roofing searches without starting with meaningful domain authority.\n\nThe $2,500/month managed program combines the software architecture with ongoing website SEO work rather than selling reports and recommendations.\n\nIf seeing the actual search results would help you decide whether it is worth discussing, I can show you the evidence directly.\n\nPeter'),
  (4, 16, 'SEO traffic is only useful if it turns into estimates',
   'Hi {{contact}},\n\nOne other part of the system that may be relevant to {{company}} is the instant quote tool. It is configured around the contractor’s own pricing structure and is designed to turn search traffic into a much lower-friction estimate request.\n\nIt sits alongside the SEO architecture rather than being sold as a separate lead form.\n\nIf you are interested, I can show you both sides of the system in one short call.\n\nPeter'),
  (5, 25, 'What one additional roofing job is worth',
   'Hi {{contact}},\n\nThe way I look at the $2,500/month program is fairly simple: it only needs to create a small number of additional profitable roofing opportunities to justify itself. The goal is not more impressions for the sake of a report. It is stronger local visibility tied directly to an estimate path.\n\nIf {{company}} is actively trying to grow organic search in {{metro}}, I think this is worth a conversation.\n\nPeter'),
  (6, 40, 'Should I close this out?',
   'Hi {{contact}},\n\nI have reached out a few times, so I will make this my last note.\n\nIf improving {{company}}’s organic roofing visibility and adding the instant quote system is something you want to look at, reply and I will send over the relevant results or set up a quick walkthrough.\n\nOtherwise I will close this out on my end.\n\nPeter')
) as s(step_number, delay_days, subject_template, text_template)
where not exists (
  select 1 from outreach_campaign_steps existing
  where existing.campaign_id = campaign.id and existing.step_number = s.step_number
);
