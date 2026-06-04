import { ImgHTMLAttributes } from 'react';
import { Box, BoxProps } from '@mui/material';
import { StaticImageData } from 'next/image';

interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  sx?: BoxProps['sx'];
  src?: string | StaticImageData;
}

const Image = ({ src, ...props }: ImageProps) => {
  const imageSrc = typeof src === 'string' ? src : src?.src;
  return <Box component="img" src={imageSrc} {...props} />;
};

export default Image;
