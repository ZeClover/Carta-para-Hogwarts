import { ageIn1890 } from "@/lib/draft";
/** Guidance only: existing validation deliberately permits exceptions agreed with the GM. */
export function BirthGuidance({ value, id }: { value: string; id: string }) {
  const age = ageIn1890(value);
  return (
    <div id={id} className="birth-guidance" aria-live="polite">
      {age !== null && (
        <p>
          <strong>
            Idade em 1º de setembro de 1890: {age} {age === 1 ? "ano" : "anos"}.
          </strong>
        </p>
      )}
      <p>
        A idade habitual para ingressar no primeiro ano é 11 anos
        {age === null
          ? " (nascimento entre 2 de setembro de 1878 e 1º de setembro de 1879)"
          : ""}
        .{" "}
        {age !== null && age !== 11
          ? "Esta data corresponde a uma idade excepcional. Combine a exceção com o Mestre; seu registro continua permitido."
          : "Exceções podem ser combinadas com o Mestre."}
      </p>
    </div>
  );
}
