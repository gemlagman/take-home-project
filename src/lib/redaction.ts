function redactPhone(phone: string) {
  if (phone.length <= 4) {
    return "****";
  }

  return `***-***-${phone.slice(-4)}`;
}

function redactSSN(ssn: string) {
  if (ssn.length <= 4) {
    return "****";
  }

  return `***-**-${ssn.slice(-4)}`;
}

function redactDateOfBirth(dateOfBirth: string) {
  const year = dateOfBirth.slice(0, 4);

  if (!year) {
    return "****-**-**";
  }

  return `${year}-**-**`;
}

export function redactIntake<
  T extends {
    clientPhone: string;
    dateOfBirth: string;
    ssn: string;
  }
>(intake: T) {
  return {
    ...intake,

    clientPhone: redactPhone(
      intake.clientPhone
    ),

    dateOfBirth: redactDateOfBirth(
      intake.dateOfBirth
    ),

    ssn: redactSSN(
      intake.ssn
    ),
  };
}