async function testStreamingEpisodes() {
  const query = `
    query GetAnimeDetails($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title { english romaji }
        streamingEpisodes {
          title
          thumbnail
          url
          site
        }
      }
    }
  `;

  for (const id of [16498, 21, 1535, 11061, 116006]) {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { id } })
    });
    const data = await res.json();
    const media = data.data.Media;
    console.log(`Anime: ${media.title.english || media.title.romaji} (ID: ${media.id})`);
    console.log(`Streaming episodes count: ${media.streamingEpisodes?.length || 0}`);
    if (media.streamingEpisodes?.length > 0) {
      console.log('Sample streaming episode:', media.streamingEpisodes[0]);
    }
    console.log('---');
  }
}

testStreamingEpisodes().catch(console.error);
