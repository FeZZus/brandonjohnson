# Ranked Postcodes API

This API endpoint receives ranked postcodes from your backend and displays them on the map.

## Endpoint

**POST** `/api/postcodes`

## Request Format

Send a POST request with one of the following formats:

### Format 1: Array of postcode strings (ranks assigned automatically)
```json
{
  "postcodes": ["SW1A 1AA", "SW1A 2AA", "SW1A 3AA", "SW1A 4AA", "SW1A 5AA"]
}
```

### Format 2: Array of postcode objects with optional coordinates
```json
{
  "postcodes": [
    { "postcode": "SW1A 1AA", "rank": 1, "lat": 51.5074, "lng": -0.1278 },
    { "postcode": "SW1A 2AA", "rank": 2, "lat": 51.5084, "lng": -0.1288 },
    { "postcode": "SW1A 3AA", "rank": 3 },
    { "postcode": "SW1A 4AA", "rank": 4 },
    { "postcode": "SW1A 5AA", "rank": 5 }
  ]
}
```

### Format 3: Direct array (without wrapper)
```json
["SW1A 1AA", "SW1A 2AA", "SW1A 3AA", "SW1A 4AA", "SW1A 5AA"]
```

## Response

```json
{
  "success": true,
  "postcodes": [
    { "postcode": "SW1A 1AA", "rank": 1, "lat": 51.5074, "lng": -0.1278 },
    ...
  ],
  "message": "Received 5 ranked postcodes"
}
```

## Retrieving Postcodes

**GET** `/api/postcodes`

Returns the currently stored ranked postcodes.

## Notes

- If coordinates (`lat`/`lng`) are not provided, the frontend will automatically geocode UK postcodes using OpenStreetMap Nominatim API
- Ranks are automatically assigned 1-5 based on array order if not specified
- The map will automatically display markers with different colors and sizes based on rank:
  - Rank 1: Red, largest marker
  - Rank 2: Orange
  - Rank 3: Yellow
  - Rank 4: Blue
  - Rank 5: Purple, smallest marker

## Example Backend Call

```typescript
// Example: Sending ranked postcodes from your backend
const response = await fetch('http://your-frontend-url/api/postcodes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    postcodes: [
      'SW1A 1AA',
      'SW1A 2AA',
      'SW1A 3AA',
      'SW1A 4AA',
      'SW1A 5AA'
    ]
  })
});
```
