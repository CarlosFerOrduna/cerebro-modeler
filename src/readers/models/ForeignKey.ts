export class ForeignKey {
  constructor(
    public name: string,
    public sourceTable: string,
    public sourceColumns: string[],
    public targetTable: string,
    public targetColumns: string[]
  ) {}
}
