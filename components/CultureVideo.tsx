import styles from '@/app/culture.module.css';

export default function CultureVideo({ src, label, caption }: { src: string; label: string; caption: string }) {
  return <figure className={styles.videoBox}>
    <video controls preload="metadata" playsInline aria-label={label}><source src={src} type="video/mp4" />Your browser does not support video playback.</video>
    <figcaption>{caption}</figcaption>
  </figure>;
}
