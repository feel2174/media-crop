import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'MediaCrop Pro';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

export default function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(to bottom right, #0f172a, #1e293b)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'sans-serif',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgb(59, 130, 246)',
                        width: '120px',
                        height: '120px',
                        borderRadius: '30px',
                        marginBottom: '40px',
                        boxShadow: '0 20px 50px rgba(59, 130, 246, 0.3)',
                    }}
                >
                    <svg
                        width="60"
                        height="60"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="6" cy="6" r="3" />
                        <circle cx="6" cy="18" r="3" />
                        <line x1="20" y1="4" x2="8.12" y2="15.88" />
                        <line x1="14.47" y1="14.48" x2="20" y2="20" />
                        <line x1="8.12" y1="8.12" x2="12" y2="12" />
                    </svg>
                </div>
                <div
                    style={{
                        fontSize: '72px',
                        fontWeight: 'bold',
                        color: 'white',
                        marginBottom: '20px',
                        letterSpacing: '-2px',
                    }}
                >
                    MediaCrop Pro
                </div>
                <div
                    style={{
                        fontSize: '28px',
                        color: 'rgb(148, 163, 184)',
                        maxWidth: '800px',
                        textAlign: 'center',
                        lineHeight: '1.4',
                    }}
                >
                    Free Music & Video Cropper. Fast, Private & Safe.
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
