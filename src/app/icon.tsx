import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'FinTrack Logo';
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 16,
          background: 'linear-gradient(to bottom right, #059669, #14b8a6)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '10px',
          fontWeight: 900,
          fontStyle: 'italic',
          fontFamily: 'sans-serif',
          boxShadow: 'inset 0 0 5px rgba(255,255,255,0.2)',
        }}
      >
        FT
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  );
}
