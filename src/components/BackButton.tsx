import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
  to?: string;
  label?: string;
}

const BackButton = ({ to = '/', label = 'Back to Home' }: BackButtonProps) => {
  return (
    <Link to={to}>
      <Button 
        variant="ghost" 
        className="gap-2 hover:bg-primary/10 text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        {label}
      </Button>
    </Link>
  );
};

export default BackButton;
