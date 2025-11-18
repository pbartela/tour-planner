-- Migration: Fix language column to use full locale codes
-- Description: Updates the profiles table language column default from 'en' to 'en-US'
--              and migrates existing 'en' values to 'en-US' and 'pl' to 'pl-PL'
--              to match the application's locale format used in URLs and i18n

begin;

-- Update existing language values to full locale codes
update public.profiles
set language = case
  when language = 'en' then 'en-US'
  when language = 'pl' then 'pl-PL'
  else language  -- Keep any other values as-is
end
where language in ('en', 'pl');

-- Update the default value for new profiles
alter table public.profiles
  alter column language set default 'en-US';

comment on column public.profiles.language is
  'User preferred language in full locale format (e.g., en-US, pl-PL). Must match locale codes used in URLs and i18n configuration.';

commit;
