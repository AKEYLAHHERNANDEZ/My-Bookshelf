// Online book lookup via the free Open Library API (no API key needed).
// Used by the "Search online" tab in the Add Book dialog.

const GENRE_KEYWORDS = [
  ['science fiction', 'Sci-Fi'],
  ['fantasy', 'Fantasy'],
  ['mystery', 'Mystery'],
  ['thriller', 'Thriller'],
  ['suspense', 'Thriller'],
  ['romance', 'Romance'],
  ['horror', 'Horror'],
  ['historical fiction', 'Historical Fiction'],
  ['biography', 'Biography'],
  ['memoir', 'Memoir'],
  ['self-help', 'Self-Help'],
  ['young adult', 'Young Adult'],
  ['classic', 'Classics'],
  ['poetry', 'Poetry'],
  ['fiction', 'Fiction'],
];

function guessGenre(subjects = []) {
  const lower = subjects.map((s) => s.toLowerCase());
  for (const [keyword, genre] of GENRE_KEYWORDS) {
    if (lower.some((s) => s.includes(keyword))) return genre;
  }
  return '';
}

export async function searchOnline(query) {
  const fields = 'title,author_name,first_publish_year,isbn,number_of_pages_median,cover_i,publisher,subject';
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&fields=${fields}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('The book search service did not respond.');
  const json = await res.json();
  return (json.docs || []).map((d) => ({
    title: d.title || '',
    author: (d.author_name || []).slice(0, 2).join(', '),
    year: d.first_publish_year || null,
    pages: d.number_of_pages_median || null,
    isbn: (d.isbn || [])[0] || '',
    publisher: (d.publisher || [])[0] || '',
    genre: guessGenre(d.subject),
    coverUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : '',
  }));
}
