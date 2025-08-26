export class Index {
  constructor(
    public name: string,
    public columns: string[],
    public isPrimaryKey: boolean,
    public isUnique: boolean
  ) {}
}
