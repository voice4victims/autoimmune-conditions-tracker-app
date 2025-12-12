import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
import { usePrivacy } from '@/contexts/PrivacyContext';

interface PrivacyStatusIndicatorProps {
    variant?: 'badge' | 'button' | 'icon';
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
    onClick?: () => void;
    className?: string;
}

const PrivacyStatusIndicator: React.FC<PrivacyStatusIndicatorProps> = ({
    variant = 'badge',
    size = 'md',
    showText = true,
    onClick,
    className = ''
}) => {
    const { privacySettings, loading, error } = usePrivacy();

    // Determine privacy status
    const getPrivacyStatus = () => {
        if (loading) {
            return {
                status: 'loading',
                message: 'Loading privacy settings...',
                icon: Clock,
                color: 'text-gray-500',
                bgColor: 'bg-gray-100',
                badgeVariant: 'secondary' as const
            };
        }

        if (error) {
            return {
                status: 'error',
                message: 'Privacy settings error',
                icon: AlertTriangle,
                color: 'text-red-600',
                bgColor: 'bg-red-100',
                badgeVariant: 'destructive' as const
            };
        }

        if (!privacySettings) {
            return {
                status: 'not-configured',
                message: 'Privacy settings not configured',
                icon: AlertTriangle,
                color: 'text-amber-600',
                bgColor: 'bg-amber-100',
                badgeVariant: 'secondary' as const
            };
        }

        // Check for privacy concerns
        const concerns = [];

        if (privacySettings.dataSharing?.researchParticipation) {
            concerns.push('Research participation enabled');
        }

        if (privacySettings.dataSharing?.thirdPartyIntegrations) {
            const activeIntegrations = Object.values(privacySettings.dataSharing.thirdPartyIntegrations)
                .filter(enabled => enabled).length;
            if (activeIntegrations > 0) {
                concerns.push(`${activeIntegrations} third-party integration${activeIntegrations > 1 ? 's' : ''} active`);
            }
        }

        if (!privacySettings.dataRetention?.automaticDeletion) {
            concerns.push('Automatic data deletion disabled');
        }

        if (privacySettings.dataSharing?.marketingConsent) {
            concerns.push('Marketing communications enabled');
        }

        if (concerns.length > 0) {
            return {
                status: 'attention-needed',
                message: `${concerns.length} privacy setting${concerns.length > 1 ? 's' : ''} need attention`,
                details: concerns,
                icon: AlertTriangle,
                color: 'text-amber-600',
                bgColor: 'bg-amber-100',
                badgeVariant: 'secondary' as const
            };
        }

        return {
            status: 'configured',
            message: 'Privacy settings configured',
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
            badgeVariant: 'secondary' as const
        };
    };

    const status = getPrivacyStatus();
    const IconComponent = status.icon;

    // Size configurations
    const sizeConfig = {
        sm: {
            icon: 'w-3 h-3',
            text: 'text-xs',
            padding: 'px-2 py-1',
            button: 'h-6 text-xs'
        },
        md: {
            icon: 'w-4 h-4',
            text: 'text-sm',
            padding: 'px-3 py-1',
            button: 'h-8 text-sm'
        },
        lg: {
            icon: 'w-5 h-5',
            text: 'text-base',
            padding: 'px-4 py-2',
            button: 'h-10 text-base'
        }
    };

    const config = sizeConfig[size];

    const content = (
        <div className="flex items-center gap-1">
            <IconComponent className={`${config.icon} ${status.color}`} />
            {showText && (
                <span className={`${config.text} font-medium`}>
                    {status.status === 'loading' ? 'Loading...' :
                        status.status === 'error' ? 'Error' :
                            status.status === 'not-configured' ? 'Not Configured' :
                                status.status === 'attention-needed' ? 'Needs Attention' :
                                    'Configured'}
                </span>
            )}
        </div>
    );

    const tooltipContent = (
        <div className="space-y-1">
            <div className="font-medium">{status.message}</div>
            {status.details && (
                <ul className="text-xs space-y-1">
                    {status.details.map((detail, index) => (
                        <li key={index} className="flex items-center gap-1">
                            <span className="w-1 h-1 bg-current rounded-full" />
                            {detail}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    if (variant === 'icon') {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={onClick}
                            className={`inline-flex items-center justify-center rounded-full p-1 ${status.bgColor} ${onClick ? 'hover:opacity-80 cursor-pointer' : ''} ${className}`}
                        >
                            <IconComponent className={`${config.icon} ${status.color}`} />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {tooltipContent}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    if (variant === 'button') {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onClick}
                            className={`${config.button} ${className}`}
                        >
                            {content}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {tooltipContent}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // Default badge variant
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge
                        variant={status.badgeVariant}
                        className={`${config.padding} cursor-help ${onClick ? 'hover:opacity-80 cursor-pointer' : ''} ${className}`}
                        onClick={onClick}
                    >
                        {content}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    {tooltipContent}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default PrivacyStatusIndicator;