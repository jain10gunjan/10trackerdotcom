// Canonical subreddit list with FlairIDs for SteinHQ posting.
// Entries without a known flair use flairID: null.
export const SUBREDDITS = [
  { name: 'r/delhi', flairID: null },
  { name: 'r/bangalore', flairID: '6698f31a-a1b8-11e7-a258-0e6fed7c0ce2' },
  { name: 'r/mumbai', flairID: 'ebd60416-a7b3-11e9-abe9-0e666d5b3874' },
  { name: 'r/chennai', flairID: null },
  { name: 'r/hyderabad', flairID: '39c93b7c-96a4-11ea-a47f-0e392b9484a9' },
  { name: 'r/Kerala', flairID: '5bb0f24e-ff54-11e9-aade-0e8505761f60' },
  { name: 'r/kolkata', flairID: '90c964a8-e357-11ed-bd6b-82e9025cdad7' },
  { name: 'r/TamilNadu', flairID: 'c45ca206-3d0c-11eb-9049-0e5b9c67655b' },
  { name: 'r/pune', flairID: '803d21ec-5f18-11e8-9a40-0e87b2eb0132' },
  { name: 'r/Maharashtra', flairID: 'd5d0dd64-7403-11ee-9f5a-faaeaa0db339' },
  { name: 'r/bihar', flairID: '2640a088-11c5-11ed-9bd1-5a34a9a5cfa9' },
  { name: 'r/ahmedabad', flairID: 'a3baf594-9bff-11ed-bbf0-3a00adbb431c' },
  { name: 'r/lucknow', flairID: '23bb867c-0ef0-11eb-b116-0ecd3404688b' },
  { name: 'r/Goa', flairID: 'fa8f967e-6f39-11e8-9caa-0e7af1f21342' },
  { name: 'r/Uttarakhand', flairID: '4975fffe-b932-11e6-a4c9-0e15273e6c4a' },
  { name: 'r/assam', flairID: null },
  { name: 'r/gurgaon', flairID: null },
  { name: 'r/karnataka', flairID: null },
  { name: 'r/Rajasthan', flairID: 'd1da9032-5dd3-11ea-9eca-0e8ec7b78b6d' },
  { name: 'r/HimachalPradesh', flairID: '700634a8-bdb8-11e9-94fb-0ea43b057764' },
  { name: 'r/Chandigarh', flairID: '1b078d34-4c29-11eb-92ec-0e24b216dbe9' },
  { name: 'r/gujarat', flairID: 'e72f3e06-e1fb-11ed-be2a-a2840b923805' },
  { name: 'r/Odisha', flairID: 'bdaf7b46-72c2-11ef-86b5-aa7eb4c0ad25' },
  { name: 'r/uttarpradesh', flairID: 'bf3530f8-5d58-11ee-bf5c-b2b3cb333a5d' },
  { name: 'r/Northeastindia', flairID: 'b55a6a76-921c-11f0-b04e-aacdd19e8ebb' },
  { name: 'r/indianews', flairID: null },
  { name: 'r/indiadiscussion', flairID: null },
  { name: 'r/IndiaNonPolitical', flairID: '5e39cd34-89b1-11e8-a7f9-0ea14a6542f8' },
];

export const SUBREDDIT_NAMES = SUBREDDITS.map((s) => s.name);
