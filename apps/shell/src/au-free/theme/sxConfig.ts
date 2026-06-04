import { SxConfig } from '@mui/system';

const sxConfig: SxConfig = {
  lineClamp: {
    style: ({ lineClamp }: any) => ({
      display: '-webkit-box',
      WebkitLineClamp: String(lineClamp),
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    }),
  },
};

export default sxConfig;
