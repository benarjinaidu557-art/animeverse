async function test() {
  const query = `
    query SearchAnime(
      $page: Int = 1,
      $perPage: Int = 50,
      $search: String,
      $genre: String,
      $seasonYear: Int,
      $status: MediaStatus,
      $format: MediaFormat,
      $countryOfOrigin: CountryCode,
      $sort: [MediaSort]
    ) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(
          type: ANIME,
          search: $search,
          genre: $genre,
          seasonYear: $seasonYear,
          status: $status,
          format: $format,
          countryOfOrigin: $countryOfOrigin,
          sort: $sort,
          isAdult: false
        ) {
          id
          title { english romaji native }
          countryOfOrigin
          format
          status
        }
      }
    }
  `;

  console.log('Testing 50 per page with countryOfOrigin: "KR"...');
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: {
        perPage: 50,
        countryOfOrigin: 'KR',
        sort: ['POPULARITY_DESC']
      }
    })
  });
  const data = await res.json();
  if (data.errors) {
    console.error('Errors:', JSON.stringify(data.errors));
  } else {
    console.log('Success! PageInfo:', data.data.Page.pageInfo);
    console.log('Media count:', data.data.Page.media.length);
    console.log('First 2 entries:', data.data.Page.media.slice(0, 2));
  }

  console.log('\nTesting multi-title search for "Shingeki no Kyojin" / "進撃の巨人"...');
  const resSearch = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: {
        perPage: 5,
        search: '進撃の巨人'
      }
    })
  });
  const dataSearch = await resSearch.json();
  console.log('Native search result:', dataSearch.data.Page.media.map(m => ({ id: m.id, title: m.title })));
}

test().catch(console.error);
