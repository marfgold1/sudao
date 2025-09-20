// src/components/layout/breadcrumb.tsx
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom"; // Import Link from react-router-dom

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
    return (
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
            {items.map((item, index) => (
                <div key={index} className="flex items-center">
                    {index > 0 && <ChevronRight className="w-4 h-4 mx-2" />}
                    {item.href ? (
                        // Use 'to' prop instead of 'href' and remove the `next/link` specific behavior
                        <Link to={item.href} className="hover:text-foreground transition-colors">
                        {item.label}
                        </Link>
                    ) : (
                        <span className="text-foreground">{item.label}</span>
                    )}
                </div>
            ))}
        </nav>
    );
}