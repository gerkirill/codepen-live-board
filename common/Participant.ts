export class Participant {
  public name: string = '';
  public penUrl: string = '';
  public fullpageUrl: string = '';
  public lastCheckTime?: Date;
  public lastChangeTime?: Date;
  public changeCount: number;
  public lastHash?: string;

  constructor() {
    this.changeCount = 0;
  }
}