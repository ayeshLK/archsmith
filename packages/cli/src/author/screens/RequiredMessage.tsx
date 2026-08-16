import React from "react";
import { Text } from "ink";

export function RequiredMessage({ field }: { field: string }): React.JSX.Element {
  return (
    <Text color="red" bold>
      Can't finish yet — {field} is required.
    </Text>
  );
}
