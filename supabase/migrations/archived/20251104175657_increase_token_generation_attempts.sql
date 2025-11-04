-- migration: 20251104175657_increase_token_generation_attempts.sql
-- description: Increases token generation max attempts from 10 to 100 to handle high-volume scenarios
-- fixes: Token generation loop was too conservative (10 attempts may fail in high-volume scenarios)

begin;

-- Update the generate_invitation_token function to use 100 max attempts instead of 10
-- This reduces the risk of failure in high-volume invitation creation scenarios
-- With 128-bit random tokens, collision probability is astronomically low even with 100 attempts
create or replace function public.generate_invitation_token()
returns trigger
language plpgsql
as $$
declare
  token_value text;
  max_attempts int := 100; -- Increased from 10 to handle high-volume scenarios
  attempts int := 0;
begin
  -- Only generate if token is null
  if NEW.token is not null then
    return NEW;
  end if;

  -- Generate unique token (32 hex characters = 128 bits)
  loop
    token_value := encode(gen_random_bytes(16), 'hex');
    attempts := attempts + 1;

    -- Check uniqueness
    exit when not exists (select 1 from public.invitations where token = token_value);

    -- Safety check to prevent infinite loop
    if attempts >= max_attempts then
      raise exception 'Failed to generate unique invitation token after % attempts', max_attempts;
    end if;
  end loop;

  -- Set the token on the NEW record
  NEW.token := token_value;
  return NEW;
end;
$$;

comment on function public.generate_invitation_token() is
  'Generates a unique 32-character hexadecimal token for invitation links. Uses 100 max attempts for high-volume scenarios. Used by trigger before INSERT.';

commit;
