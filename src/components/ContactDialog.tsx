import { Mail, Phone, MessageCircle, Send, Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PersonAvatar } from "@/components/PersonAvatar";
import type { ContactInfo } from "@/data/members";
import { useI18n } from "@/lib/i18n";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  position?: string;
  company?: string;
  photo?: string;
  contactInfo?: ContactInfo;
}

export function ContactDialog({
  open,
  onOpenChange,
  name,
  position,
  company,
  photo,
  contactInfo,
}: ContactDialogProps) {
  const { lang } = useI18n();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const he = lang === "he";

  const copyToClipboard = (text: string, field: string) => {
    void navigator.clipboard?.writeText(text);
    setCopiedField(field);
    toast.success(he ? "הועתק ללוח" : "Copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const hasContactInfo = contactInfo && (
    contactInfo.email ||
    contactInfo.phone ||
    contactInfo.whatsapp ||
    contactInfo.telegram
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir={he ? "rtl" : "ltr"}>
        <DialogHeader>
          <div className="flex items-center gap-4">
            <PersonAvatar name={name} photo={photo} size="lg" />
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl">{name}</DialogTitle>
              {position && (
                <DialogDescription className="mt-1">
                  {position}
                  {company && ` · ${company}`}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          {!hasContactInfo ? (
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                {he
                  ? "פרטי יצירת קשר לא זמינים כרגע"
                  : "Contact details are not currently available"}
              </p>
            </div>
          ) : (
            <>
              {/* Preferred contact badge */}
              {contactInfo?.preferredContact && (
                <div className="mb-4 flex items-center justify-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                  {he ? "דרך יצירת קשר מועדפת:" : "Preferred contact method:"}
                  <span className="font-semibold">
                    {contactInfo.preferredContact === "email" && (he ? "דוא״ל" : "Email")}
                    {contactInfo.preferredContact === "phone" && (he ? "טלפון" : "Phone")}
                    {contactInfo.preferredContact === "whatsapp" && "WhatsApp"}
                    {contactInfo.preferredContact === "telegram" && "Telegram"}
                  </span>
                </div>
              )}

              {/* Email */}
              {contactInfo?.email && (
                <ContactRow
                  icon={<Mail className="size-5" />}
                  label={he ? "דוא״ל" : "Email"}
                  value={contactInfo.email}
                  href={`mailto:${contactInfo.email}`}
                  onCopy={() => copyToClipboard(contactInfo.email!, "email")}
                  copied={copiedField === "email"}
                  isPreferred={contactInfo.preferredContact === "email"}
                />
              )}

              {/* Phone */}
              {contactInfo?.phone && (
                <ContactRow
                  icon={<Phone className="size-5" />}
                  label={he ? "טלפון" : "Phone"}
                  value={contactInfo.phone}
                  href={`tel:${contactInfo.phone.replace(/[-\s]/g, "")}`}
                  onCopy={() => copyToClipboard(contactInfo.phone!, "phone")}
                  copied={copiedField === "phone"}
                  isPreferred={contactInfo.preferredContact === "phone"}
                />
              )}

              {/* WhatsApp */}
              {contactInfo?.whatsapp && (
                <ContactRow
                  icon={<MessageCircle className="size-5" />}
                  label="WhatsApp"
                  value={contactInfo.whatsapp}
                  href={`https://wa.me/${contactInfo.whatsapp.replace(/[-\s]/g, "").replace(/^0/, "972")}`}
                  onCopy={() => copyToClipboard(contactInfo.whatsapp!, "whatsapp")}
                  copied={copiedField === "whatsapp"}
                  isPreferred={contactInfo.preferredContact === "whatsapp"}
                  external
                />
              )}

              {/* Telegram */}
              {contactInfo?.telegram && (
                <ContactRow
                  icon={<Send className="size-5" />}
                  label="Telegram"
                  value={`@${contactInfo.telegram}`}
                  href={`https://t.me/${contactInfo.telegram}`}
                  onCopy={() => copyToClipboard(contactInfo.telegram!, "telegram")}
                  copied={copiedField === "telegram"}
                  isPreferred={contactInfo.preferredContact === "telegram"}
                  external
                />
              )}
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {he ? "סגירה" : "Close"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ContactRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
  onCopy: () => void;
  copied: boolean;
  isPreferred?: boolean;
  external?: boolean;
}

function ContactRow({
  icon,
  label,
  value,
  href,
  onCopy,
  copied,
  isPreferred,
  external,
}: ContactRowProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
        isPreferred ? "border-primary bg-primary/5" : "border-border"
      }`}
    >
      <div className={`${isPreferred ? "text-primary" : "text-muted-foreground"}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="truncate font-medium" dir="ltr">
          {value}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onCopy}
          aria-label="Copy"
        >
          {copied ? (
            <Check className="size-4 text-success" />
          ) : (
            <Copy className="size-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          asChild
        >
          <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
            <ExternalLink className="size-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}
