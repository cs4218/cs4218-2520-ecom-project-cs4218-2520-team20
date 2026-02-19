import Category from "./categoryModel.js";
import mongoose from "mongoose";

describe("Category model", () => {
  it("creates a category with valid name and slug", () => {
    const cat = new Category({ name: "Gadgets", slug: "gadgets" });

    expect(cat.name).toBe("Gadgets");
    expect(cat.slug).toBe("gadgets");
  });

  it("converts slug to lowercase", () => {
    const cat = new Category({ name: "Gadgets", slug: "GADGETS" });

    expect(cat.slug).toBe("gadgets");
  });

  it("requires a name", () => {
    const cat = new Category({ slug: "gadgets" });

    const error = cat.validateSync();
    expect(error.errors.name).toBeDefined();
  });
});
