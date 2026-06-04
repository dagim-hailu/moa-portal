import { useEffect, useState } from 'react';
import { Link, SvgIcon, SvgIconProps, Typography, typographyClasses } from '@mui/material';
import { rootPaths } from 'routes/paths';

interface LogoProps extends SvgIconProps {
  showName?: boolean;
  textColor?: string;
}

const Logo = ({ sx, viewBox = '0 0 26 40', showName = true, textColor, ...rest }: LogoProps) => {
  const [id, setId] = useState('logo');

  useEffect(() => {
    setId(`logo-${Math.floor(Math.random() * 1000) + 1}`);
  }, []);

  return (
    <Link
      href={rootPaths.root}
      underline="none"
      sx={{
        display: 'flex',
        alignItems: 'center',
        '&:hover': {
          [`& .${typographyClasses.root}`]: {
            opacity: 0.8,
          },
        },
      }}
    >
      <SvgIcon
        viewBox={viewBox}
        sx={{
          height: 40,
          width: 26,
          ...sx,
        }}
        {...rest}
      >
        <path
          d="M0.428711 1.68945V13.9413C0.428711 16.3924 2.77965 18.5801 6.30599 19.4106L16.7827 21.8779L22.9541 23.3334C22.9602 23.3334 22.9664 23.3377 22.9725 23.3377C24.6079 23.7284 25.4287 24.7331 25.4287 25.7335V9.39644C25.4287 8.46903 24.7252 7.54162 23.3181 7.09934C23.312 7.09505 23.3058 7.09075 23.2996 7.09505L16.7827 5.55366L0.428711 1.68945Z"
          fill="#1A7554"
        />
        <path
          d="M4.85352 19.0703V34.2138C4.85352 33.222 5.66196 32.2259 7.27269 31.8266C7.28499 31.8223 7.29735 31.8223 7.30971 31.818C7.31589 31.818 7.32207 31.8137 7.32819 31.8137L11.7469 30.7746L13.4995 30.3624L22.954 28.1341L22.9972 28.1212C24.6141 27.7262 25.4287 26.7301 25.4287 25.734C25.4287 24.7379 24.6079 23.7288 22.9725 23.3381C22.9663 23.3381 22.9602 23.3339 22.954 23.3339L16.7827 21.8826L4.85352 19.0703Z"
          fill="#2A9D90"
        />
        <path
          d="M4.85352 34.2131C4.85352 35.2178 5.68048 36.2225 7.32823 36.6132L11.7469 37.6565L13.4995 38.0687L17.2842 38.9609C19.0945 39.3876 21.0039 38.5104 21.0039 37.2519V28.5928L16.7827 29.5889L13.4995 30.3617L11.7469 30.7739L7.32823 31.813C7.32823 31.813 7.31586 31.8173 7.30968 31.8173C7.29739 31.8215 7.28502 31.8216 7.27266 31.8259C5.66196 32.2252 4.85352 33.2213 4.85352 34.2131Z"
          fill="#47829A"
        />
      </SvgIcon>
      {showName && (
        <Typography
          sx={{
            color: textColor || 'primary.main',
            fontWeight: 700,
            fontSize: 29.5,
            lineHeight: 1,
            margin: 1,
            marginLeft: 0.625,
            letterSpacing: '-.8px',
          }}
        >
          MOA Portal
        </Typography>
      )}
    </Link>
  );
};

export default Logo;
