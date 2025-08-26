export class Column {
  constructor(
    public name: string,
    public type: string,
    public isNullable: boolean,
    public isPrimary: boolean = false,
    public isUnique: boolean = false,
    public defaultValue?: string,
    public isIdentity: boolean = false,
    public length?: number,
    public precision?: number,
    public scale?: number
  ) {}
}
